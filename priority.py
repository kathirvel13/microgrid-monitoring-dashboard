import time
import json
import struct
import mysql.connector
import paho.mqtt.client as mqtt
from pymodbus.client.sync import ModbusSerialClient
import requests

# -----------------------------
# SERIAL CONFIG
# -----------------------------
client = ModbusSerialClient(
    method='rtu',
    port="/dev/ttyAMA0",
    baudrate=9600,
    parity='N',
    stopbits=1,
    bytesize=8,
    timeout=0.5
)
client.connect()

BATTERY_CAPACITY_AH = 6.0
soc = 100.0
last_time = time.time()
ORIGINAL_CAPACITY_AH = 6.0
discharged_ah = 0.0
soc_last_time = time.time()
soh_last_time = time.time()
previous_soh = 100.0

# =========================================================
# MQTT CONFIG (UPDATED)
# =========================================================
MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 1883
MQTT_TOPIC = "battery/data"

mqtt_client = mqtt.Client(protocol=mqtt.MQTTv311)
mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)

# =========================================================
# THINGSPEAK CONFIG (UPDATED WITH TWO CHANNELS)
# =========================================================
THINGSPEAK_URL = "https://api.thingspeak.com/update"

# DC Channel (Battery & Solar)
DC_WRITE_API = "2U42ZCXWAVVFZL9R"

# AC Channel (AC Meters)
AC_WRITE_API = "4BEO7KIZI8ZJMTQH"

# =========================================================
# ENERGY TRACKING (FOR THINGSPEAK)
# =========================================================
battery_energy = 0.0
solar_energy = 0.0
ac1_energy = 0.0
ac2_energy = 0.0

# =========================================================
# MYSQL CONFIG
# =========================================================
db = mysql.connector.connect(
    host="localhost",
    user="solaruser",
    password="123",
    database="priority_monitor"
)
cursor = db.cursor()

# =========================================================
# RELAY MAP
# =========================================================
relay_map = {
    25:3,
    26:4,
    27:5,
    28:6
}

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

# STATE MEMORY
last_level = None
active_slaves = set()

# =========================================================
# RELAY FUNCTIONS (UNCHANGED)
# =========================================================
def turn_on_relay(slave, relay):
    client.write_register(relay, 1, unit=slave)
    time.sleep(0.05)

def turn_off_all(slave):
    for i in range(1, 9):
        client.write_register(i, 0, unit=slave)
        time.sleep(0.02)

# =========================================================
# SMART PRIORITY CONTROL (UNCHANGED)
# =========================================================
def activate_priority(level):

    global active_slaves

    print(f"⚡ Adjusting to level {level}")

    slaves = list(relay_map.keys())
    required_slaves = set(slaves[:level])

    # 🔻 Turn OFF only extra loads
    for slave in active_slaves - required_slaves:
        print(f"🔻 OFF → Slave {slave}")
        turn_off_all(slave)

    # ➡️ Turn ON only new loads
    for slave in required_slaves - active_slaves:
        relay = relay_map[slave]

        print(f"➡️ ON → Slave {slave}, Relay {relay}")

        turn_off_all(slave)
        time.sleep(0.1)
        turn_on_relay(slave, relay)

    active_slaves = required_slaves

# =========================================================
# DC METER READ (UNCHANGED)
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
# SOC CALCULATION (UNCHANGED)
# =========================================================
def calculate_soc(current, voltage):

    global soc, soc_last_time

    now = time.time()

    delta_time = (now - soc_last_time) / 3600.0
    soc_last_time = now

    # Coulomb counting
    soc_change = (current * delta_time / BATTERY_CAPACITY_AH) * 100

    soc -= soc_change

    # Voltage correction
    if voltage >= 12.6:
        soc = 100

    if voltage <= 7.3:
        soc = 0

    # Limits
    if soc > 100:
        soc = 100

    if soc < 0:
        soc = 0

    return soc
    
# =========================================================
# UPDATE BATTERY CAPACITY (UNCHANGED)
# =========================================================
def update_battery_capacity(current):

    global discharged_ah, soh_last_time
    
    now = time.time()

    delta_time = (now - soh_last_time) / 3600.0
    soh_last_time = now

    # Count only discharge current
    if current > 0:

        discharged_ah += current * delta_time

    return discharged_ah

# =========================================================
# CALCULATE SOH (UNCHANGED)
# =========================================================
def calculate_soh():

    global discharged_ah

    if soc <= 5:

        measured_capacity = discharged_ah

        soh = (
            measured_capacity /
            ORIGINAL_CAPACITY_AH
        ) * 100

        discharged_ah = 0

        return round(soh, 1)

    return None

# =========================================================
# LOAD CONTROL (UNCHANGED)
# =========================================================
def control_loads(soc):

    global last_level

    if soc >= 80:
        level = 4
        state = "FULL LOAD"
    elif soc >= 50:
        level = 3
        state = "HIGH"
    elif soc >= 20:
        level = 2
        state = "MEDIUM"
    else:
        level = 1
        state = "CRITICAL"

    if level == last_level:
        print("✅ No change")
        return

    last_level = level

    print(f"⚡ {state}")

    activate_priority(level)

# =========================================================
# MQTT PUBLISH (UPDATED - FULL INTEGRATION)
# =========================================================
def publish_mqtt(dc_voltage, dc_current, dc_power, soc, soh, ac1_voltage, ac1_current, ac1_power, ac1_frequency, ac1_pf, ac2_voltage, ac2_current, ac2_power, ac2_frequency, ac2_pf):

    payload = {

        # DC DATA
        "dc_voltage": dc_voltage,
        "dc_current": dc_current,
        "dc_power": dc_power,

        "soc": soc,
        "soh": soh,

        # AC METER 1
        "ac1_voltage": ac1_voltage,
        "ac1_current": ac1_current,
        "ac1_power": ac1_power,
        "ac1_frequency": ac1_frequency,
        "ac1_power_factor": ac1_pf,

        # AC METER 2
        "ac2_voltage": ac2_voltage,
        "ac2_current": ac2_current,
        "ac2_power": ac2_power,
        "ac2_frequency": ac2_frequency,
        "ac2_power_factor": ac2_pf,

        "timestamp": time.time()
    }

    mqtt_client.publish(MQTT_TOPIC, json.dumps(payload))

# =========================================================
# THINGSPEAK UPLOAD - DC CHANNEL (UPDATED)
# =========================================================
def upload_dc_thingspeak(voltage, current, power, soc, soh):

    global battery_energy

    battery_energy += power / 3600.0

    payload = {
        "api_key": DC_WRITE_API,

        "field1": voltage,
        "field2": current,
        "field3": power,
        "field4": soc,
        "field5": soh,
        "field6": round(battery_energy, 3)
    }

    try:
        response = requests.post(
            THINGSPEAK_URL,
            data=payload,
            timeout=5
        )
        print("DC ThingSpeak:", response.text)
    except Exception as e:
        print("DC ThingSpeak Error:", e)

# =========================================================
# THINGSPEAK UPLOAD - AC CHANNEL (UPDATED)
# =========================================================
def upload_ac_thingspeak(ac1_voltage, ac1_current, ac1_power, ac2_voltage, ac2_current, ac2_power):

    global ac1_energy, ac2_energy

    ac1_energy += ac1_power / 3600.0
    ac2_energy += ac2_power / 3600.0

    payload = {
        "api_key": AC_WRITE_API,

        # AC Meter 1
        "field1": ac1_voltage,
        "field2": ac1_current,
        "field3": ac1_power,

        # AC Meter 2
        "field4": ac2_voltage,
        "field5": ac2_current,
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
# MYSQL (UNCHANGED)
# =========================================================
def save_to_mysql(voltage, current, power, soc, soh, discharged_ah):

    query = """
    INSERT INTO dc_meter_data
    (timestamp, voltage, current, power, soc, soh, discharged_ah)
    VALUES (NOW(), %s, %s, %s, %s, %s, %s)
    """

    cursor.execute(
        query,
        (
            voltage,
            current,
            power,
            soc,
            soh,
            discharged_ah
        )
    )
    db.commit()

# =========================================================
# MAIN LOOP
# =========================================================
print("🚀 Smart Load Shedding System Started")

last_thingspeak = 0

while True:

    voltage, current, power = read_dc_meter()
    time.sleep(0.05)
    
    # AC Meter 1
    ac1_voltage, ac1_current, ac1_power, ac1_frequency, ac1_pf = read_pzem(3)
    time.sleep(0.05)

    # AC Meter 2
    ac2_voltage, ac2_current, ac2_power, ac2_frequency, ac2_pf = read_pzem(4)
    time.sleep(0.05)

    # Update SOC
    soc = calculate_soc(current, voltage)

    # Track discharged Ah
    update_battery_capacity(current)

    # Calculate SOH
    soh_value = calculate_soh()

    if soh_value is not None:
        previous_soh = soh_value

    soh = previous_soh

    print(
        f"🔋 V={voltage:.2f} | "
        f"I={current:.2f} | "
        f"SOC={soc:.1f}% | "
        f"SOH={soh:.1f}%"
    )
    print(
        f"⚡ AC1: {ac1_voltage:.1f}V | "
        f"{ac1_current:.2f}A | "
        f"{ac1_power:.1f}W | "
        f"PF={ac1_pf:.2f}"
    )

    print(
        f"⚡ AC2: {ac2_voltage:.1f}V | "
        f"{ac2_current:.2f}A | "
        f"{ac2_power:.1f}W | "
        f"PF={ac2_pf:.2f}"
    )

    control_loads(soc)

    # MQTT EVERY SECOND
    publish_mqtt(

        voltage,
        current,
        power,

        soc,
        soh,

        # AC1
        ac1_voltage,
        ac1_current,
        ac1_power,
        ac1_frequency,
        ac1_pf,

        # AC2
        ac2_voltage,
        ac2_current,
        ac2_power,
        ac2_frequency,
        ac2_pf
    )

    # THINGSPEAK EVERY 15 SEC
    current_time = time.time()
    if current_time - last_thingspeak >= 15:
        upload_dc_thingspeak(
            voltage,
            current,
            power,
            soc,
            soh
        )
        upload_ac_thingspeak(
            ac1_voltage,
            ac1_current,
            ac1_power,
            ac2_voltage,
            ac2_current,
            ac2_power
        )
        last_thingspeak = current_time

    save_to_mysql(
        voltage,
        current,
        power,
        soc,
        soh,
        discharged_ah
    )

    time.sleep(1)
