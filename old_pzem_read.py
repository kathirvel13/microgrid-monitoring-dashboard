import time
import json
import mysql.connector
import paho.mqtt.client as mqtt
from pymodbus.client.sync import ModbusSerialClient

# -----------------------------
# SERIAL CONFIG
# -----------------------------
PORT = "/dev/ttyAMA0"
BAUDRATE = 9600

client = ModbusSerialClient(
    method='rtu',
    port=PORT,
    baudrate=BAUDRATE,
    parity='N',
    stopbits=1,
    bytesize=8,
    timeout=1
)

client.connect()

# -----------------------------
# MQTT CONFIG
# -----------------------------

MQTT_BROKER = "broker.emqx.io"
MQTT_TOPIC = "power/sources"

mqtt_client = mqtt.Client()
mqtt_client.connect(MQTT_BROKER,1883,60)

# -----------------------------
# MYSQL CONFIG
# -----------------------------

db = mysql.connector.connect(
    host="localhost",
    user="solaruser",
    password="123",
    database="power_monitor"
)

cursor = db.cursor()

# -----------------------------
# RELAY CONFIG
# -----------------------------

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

# Track current relay state
relay_state = {
    26:relay_map[26],
    27:relay_map[27],
    28:relay_map[28]
}

VOLTAGE_THRESHOLD = 200

# -----------------------------
# RELAY FUNCTIONS
# -----------------------------

def turn_on_relay(slave, relay):
    client.write_register(relay,1,unit=slave)
    relay_state[slave] = relay
    time.sleep(0.1)

def turn_off_all(slave):
    for i in range(1,9):
        client.write_register(i,0,unit=slave)
        time.sleep(0.05)

# -----------------------------
# READ PZEM
# -----------------------------

def read_pzem(slave):

    for _ in range(3):

        result = client.read_input_registers(0x0000,10,unit=slave)

        if not result.isError():

            data = result.registers

            voltage = data[0] / 10.0
            current = (data[1] + (data[2] << 16)) / 1000.0
            power = (data[3] + (data[4] << 16)) / 10.0

            return voltage,current,power

        time.sleep(0.1)

    return 0,0,0

# -----------------------------
# READ DC METER
# -----------------------------

def read_dc_meter():

    result = client.read_input_registers(0x0000,2,unit=1)

    if result.isError():
        return 0,0,0

    voltage = result.registers[0] / 10.0
    current = result.registers[1] / 100.0
    power = voltage * current

    return voltage,current,power

# -----------------------------
# SAVE TO MYSQL
# -----------------------------

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

# -----------------------------
# RELAY EVENT LOG
# -----------------------------

def log_relay_event(slave,relay,reason):

    query = """
    INSERT INTO relay_events
    (timestamp,module_slave,relay_number,reason)
    VALUES (NOW(),%s,%s,%s)
    """

    cursor.execute(query,(slave,relay,reason))
    db.commit()

# -----------------------------
# SEND MQTT
# -----------------------------

def publish_mqtt(data):

    payload = json.dumps(data)

    mqtt_client.publish(MQTT_TOPIC,payload)

# -----------------------------
# INITIAL RELAY STATE
# -----------------------------

for slave,relay in relay_map.items():
    turn_off_all(slave)
    turn_on_relay(slave,relay)

print("System Ready")

# -----------------------------
# MAIN LOOP
# -----------------------------

while True:

    v1,i1,p1 =read_dc_meter() 
    time.sleep(0.2)
    v2,i2,p2 = read_pzem(3)
    time.sleep(0.2)
    v3,i3,p3 = read_pzem(4)

    sources = {
        26:{"voltage":v1,"current":i1,"power":p1},
        27:{"voltage":v2,"current":i2,"power":p2},
        28:{"voltage":v3,"current":i3,"power":p3}
    }

    print("\nSource Data:",sources)

    # -----------------------------
    # MYSQL LOGGING
    # -----------------------------

    save_to_mysql(1,v1,i1,p1)
    save_to_mysql(2,v2,i2,p2)
    save_to_mysql(3,v3,i3,p3)

    # -----------------------------
    # MQTT PUBLISH
    # -----------------------------

    mqtt_payload = {
        "source1":{"voltage":v1,"current":i1,"power":p1},
        "source2":{"voltage":v2,"current":i2,"power":p2},
        "source3":{"voltage":v3,"current":i3,"power":p3}
    }

    publish_mqtt(mqtt_payload)

    # -----------------------------
    # SWITCHING LOGIC
    # -----------------------------

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
            time.sleep(1)
            turn_on_relay(slave,relay_to_use)

            log_relay_event(slave,relay_to_use,"source_failover")

            print(f"Switched {slave} → Relay {relay_to_use}")

        elif voltage >= VOLTAGE_THRESHOLD and source_failed[slave]:

            print(f"Source {slave} restored")

            source_failed[slave] = False

            original_relay = relay_map[slave]

            turn_off_all(slave)
            time.sleep(1)
            turn_on_relay(slave,original_relay)

            log_relay_event(slave,original_relay,"source_restored")

    time.sleep(0.5)