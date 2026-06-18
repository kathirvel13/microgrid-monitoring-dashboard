import time
import json
import mysql.connector
import paho.mqtt.client as mqtt
from pymodbus.client.sync import ModbusSerialClient
import struct
import requests

# =========================================================
# SERIAL CONFIG
# =========================================================
PORT = "/dev/ttyAMA0"
BAUDRATE = 9600

client = ModbusSerialClient(
    method='rtu',
    port=PORT,
    baudrate=BAUDRATE,
    parity='N',
    stopbits=1,
    bytesize=8,
    timeout=0.5
)

client.connect()

# =========================================================
# MQTT CONFIG (UPDATED)
# =========================================================
MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 1883
MQTT_TOPIC = "power/data"

mqtt_client = mqtt.Client()
mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)

# =========================================================
# THINGSPEAK CONFIG (UPDATED - SINGLE AC CHANNEL)
# =========================================================
THINGSPEAK_URL = "https://api.thingspeak.com/update"
AC_WRITE_API = "MZOA1SABJ88ZI00G"

# =========================================================
# ENERGY TRACKING (FOR THINGSPEAK)
# =========================================================
ac1_energy = 0.0
ac2_energy = 0.0

# =========================================================
# MYSQL CONFIG
# =========================================================
db = mysql.connector.connect(
    host="localhost",
    user="solaruser",
    password="123",
    database="power_monitor"
)

cursor = db.cursor()

# =========================================================
# RELAY CONFIG
# =========================================================
relay_map = {
    26:4,
    27:5,
    28:6
}

source_failed = {
    26:False,
    27:False,
    28:False
}

relay_state = {
    26:relay_map[26],
    27:relay_map[27],
    28:relay_map[28]
}

VOLTAGE_THRESHOLD = 200

# =========================================================
# RELAY FUNCTIONS (UNCHANGED)
# =========================================================
def turn_on_relay(slave, relay):
    client.write_register(relay,1,unit=slave)
    relay_state[slave] = relay
    time.sleep(0.05)

def turn_off_all(slave):
    for i in range(1,9):
        client.write_register(i,0,unit=slave)
        time.sleep(0.02)

# =========================================================
# READ PZEM (UNCHANGED)
# =========================================================
def read_pzem(slave):

    for _ in range(2):

        result = client.read_input_registers(0x0000,10,unit=slave)

        if not result.isError():

            data = result.registers

            voltage = data[0] / 10.0
            current = (data[1] + (data[2] << 16)) / 1000.0
            power = (data[3] + (data[4] << 16)) / 10.0

            frequency = data[7] / 10.0
            power_factor = data[8] / 100.0

            return voltage,current,power,frequency,power_factor

        time.sleep(0.05)

    return 0,0,0,0,0

# =========================================================
# READ DC METER (UNCHANGED)
# =========================================================
def read_dc_meter(slave=2):

    result = client.read_input_registers(0x0000, 6, unit=slave)

    if result.isError():
        return 0,0,0

    regs = result.registers

    def to_float_swapped(r1, r2):
        return struct.unpack('>f', struct.pack('>HH', r2, r1))[0]

    current = to_float_swapped(regs[2], regs[3])
    voltage = to_float_swapped(regs[4], regs[5])

    if abs(current) < 0.1:
        current = 0.0

    power = voltage * current

    return voltage, current, power

# =========================================================
# MQTT PUBLISH (UPDATED)
# =========================================================
def publish_mqtt(voltage, current, power, frequency, pf, ac1_voltage=0, ac1_current=0, ac1_power=0, ac1_frequency=0, ac1_pf=0, ac2_voltage=0, ac2_current=0, ac2_power=0, ac2_frequency=0, ac2_pf=0):

    payload = {
        "source": "ac_sources",
        "voltage": voltage,
        "current": current,
        "power": power,
        "frequency": frequency,
        "power_factor": pf,
        
        # AC Meter 1
        "ac1_voltage": ac1_voltage,
        "ac1_current": ac1_current,
        "ac1_power": ac1_power,
        "ac1_frequency": ac1_frequency,
        "ac1_power_factor": ac1_pf,
        
        # AC Meter 2
        "ac2_voltage": ac2_voltage,
        "ac2_current": ac2_current,
        "ac2_power": ac2_power,
        "ac2_frequency": ac2_frequency,
        "ac2_power_factor": ac2_pf,
        
        "timestamp": time.time()
    }

    mqtt_client.publish(MQTT_TOPIC, json.dumps(payload))

# =========================================================
# THINGSPEAK UPLOAD - AC CHANNEL (UPDATED)
# =========================================================
def upload_ac_thingspeak(ac1_voltage, ac1_current, ac1_power, ac2_voltage, ac2_current, ac2_power):

    global ac1_energy, ac2_energy

    ac1_energy += ac1_power / 3600.0
    ac2_energy += ac2_power / 3600.0

    payload = {
        "api_key": AC_WRITE_API,

        # Feeder 3 - AC Meter 1
        "field1": ac1_voltage,
        "field2": ac2_voltage,

        "field3": ac1_current,
        "field4": ac2_current,

        "field5": ac1_power,
        "field6": ac2_power,

        "field7": round(ac1_energy, 3),
        "field8": round(ac2_energy, 3)
    }

    try:
        response = requests.post(
            THINGSPEAK_URL,
            data=payload,
            timeout=5
        )
        print("AC ThingSpeak:", response.text)
    except Exception as e:
        print("AC ThingSpeak Error:", e)

# =========================================================
# SAVE TO MYSQL (UNCHANGED)
# =========================================================
def save_to_mysql(source,voltage,current,power):

    table_map = {
        1:"pzem3_data",
        2:"pzem4_data",
        3:"dc_meter_data"
    }

    slave_map = {
        1:26,
        2:27,
        3:28
    }

    table = table_map[source]
    slave = slave_map[source]
    relay = relay_state[slave]

    query = f"""
    INSERT INTO {table}
    (timestamp,voltage,current,power,relay_state)
    VALUES (NOW(),%s,%s,%s,%s)
    """

    cursor.execute(query,(voltage,current,power,relay))
    db.commit()

# =========================================================
# RELAY EVENT LOG (UNCHANGED)
# =========================================================
def log_relay_event(slave,relay,reason):

    query = """
    INSERT INTO relay_events
    (timestamp,module_slave,relay_number,reason)
    VALUES (NOW(),%s,%s,%s)
    """

    cursor.execute(query,(slave,relay,reason))
    db.commit()

# =========================================================
# INITIAL RELAY STATE
# =========================================================
for slave,relay in relay_map.items():
    turn_off_all(slave)
    turn_on_relay(slave,relay)

print("System Ready")

# =========================================================
# INITIAL FAULT CHECK
# =========================================================
v1,i1,p1 = read_dc_meter()
time.sleep(0.05)

v2,i2,p2,f2,pf2 = read_pzem(3)
time.sleep(0.05)

v3,i3,p3,f3,pf3 = read_pzem(4)

initial_sources = {
    26:{"voltage":v1},
    27:{"voltage":v2},
    28:{"voltage":v3}
}

for slave,data in initial_sources.items():
    source_failed[slave] = data["voltage"] < VOLTAGE_THRESHOLD

print("Initial fault states:", source_failed)

# =========================================================
# MAIN LOOP
# =========================================================
last_thingspeak = 0

while True:

    # READ DATA
    v1,i1,p1 = read_dc_meter()
    time.sleep(0.05)

    v2,i2,p2,f2,pf2 = read_pzem(3)
    time.sleep(0.05)

    v3,i3,p3,f3,pf3 = read_pzem(4)

    sources = {
        26:{"voltage":v1,"current":i1,"power":p1},
        27:{"voltage":v2,"current":i2,"power":p2, "frequency":f2, "power_factor": pf2},
        28:{"voltage":v3,"current":i3,"power":p3, "frequency":f3, "power_factor" : pf3}
    }

    print("\nSource Data:",sources)

    # MYSQL LOGGING
    save_to_mysql(1,v1,i1,p1)
    save_to_mysql(2,v2,i2,p2)
    save_to_mysql(3,v3,i3,p3)

    # MQTT PUBLISH EVERY SECOND (UPDATED WITH AC DATA)
    publish_mqtt(
        v1,i1,p1,0,0,
        v2,i2,p2,f2,pf2,
        v3,i3,p3,f3,pf3
    )

    # THINGSPEAK EVERY 15 SEC (UPDATED)
    current_time = time.time()
    if current_time - last_thingspeak >= 15:
        upload_ac_thingspeak(v2,i2,p2,v3,i3,p3)
        last_thingspeak = current_time

    # SWITCHING LOGIC (UNCHANGED)
    for slave,data in sources.items():

        voltage = data["voltage"]

        if voltage < VOLTAGE_THRESHOLD and not source_failed[slave]:

            print(f"Source {slave} dropped")
            source_failed[slave] = True

            valid_sources = {
                k:v for k,v in sources.items()
                if v["voltage"] >= VOLTAGE_THRESHOLD
            }

            if not valid_sources:
                continue

            if all(v["current"] < 0.1 for v in valid_sources.values()):
                best_source = max(valid_sources,key=lambda x: valid_sources[x]["voltage"])
            else:
                best_source = min(valid_sources,key=lambda x: valid_sources[x]["current"])

            relay_to_use = relay_map[best_source]

            turn_off_all(slave)
            time.sleep(0.2)
            turn_on_relay(slave,relay_to_use)

            log_relay_event(slave,relay_to_use,"source_failover")

            print(f"Switched {slave} → Relay {relay_to_use}")

        elif voltage >= VOLTAGE_THRESHOLD and source_failed[slave]:

            print(f"Source {slave} restored")
            source_failed[slave] = False

            original_relay = relay_map[slave]

            turn_off_all(slave)
            time.sleep(0.2)
            turn_on_relay(slave,original_relay)

            log_relay_event(slave,original_relay,"source_restored")

    time.sleep(0.1)
