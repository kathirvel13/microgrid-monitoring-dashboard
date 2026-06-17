import time
import json
import random
import requests
import paho.mqtt.client as mqtt

# =========================================================
# MQTT CONFIG
# =========================================================

MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 1883
MQTT_TOPIC = "battery/data"

mqtt_client = mqtt.Client(protocol=mqtt.MQTTv311)
mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)

# =========================================================
# THINGSPEAK CONFIG
# =========================================================

THINGSPEAK_URL = "https://api.thingspeak.com/update"

# Replace with your actual WRITE API keys
AC_WRITE_API = "MZOA1SABJ88ZI00G"
DC_WRITE_API = "4BEO7KIZI8ZJMTQH"

# =========================================================
# ENERGY VARIABLES
# =========================================================

battery_energy = 0.0
solar_energy = 0.0
ac1_energy = 0.0
ac2_energy = 0.0

# =========================================================
# RANDOM DATA GENERATION
# =========================================================

def generate_dc_values():

    # Solar panel values
    solar_voltage = round(random.uniform(17.0, 22.5), 2)
    solar_current = round(random.uniform(0.5, 4.5), 2)

    # Battery values
    battery_voltage = round(random.uniform(11.0, 13.0), 2)
    battery_current = round(random.uniform(0.2, 3.0), 2)

    solar_power = round(solar_voltage * solar_current, 2)
    battery_power = round(battery_voltage * battery_current, 2)

    soc = round(random.uniform(25, 100), 1)
    soh = round(random.uniform(85, 100), 1)

    return {
        "solar_voltage": solar_voltage,
        "solar_current": solar_current,
        "solar_power": solar_power,

        "battery_voltage": battery_voltage,
        "battery_current": battery_current,
        "battery_power": battery_power,

        "soc": soc,
        "soh": soh
    }


def generate_ac_values():

    ac1_voltage = round(random.uniform(220, 240), 1)
    ac2_voltage = round(random.uniform(220, 240), 1)

    ac1_current = round(random.uniform(0.2, 5.0), 2)
    ac2_current = round(random.uniform(0.2, 5.0), 2)

    ac1_pf = round(random.uniform(0.75, 0.99), 2)
    ac2_pf = round(random.uniform(0.75, 0.99), 2)

    ac1_frequency = round(random.uniform(49.8, 50.2), 1)
    ac2_frequency = round(random.uniform(49.8, 50.2), 1)

    ac1_power = round(ac1_voltage * ac1_current * ac1_pf, 2)
    ac2_power = round(ac2_voltage * ac2_current * ac2_pf, 2)

    return {
        "ac1_voltage": ac1_voltage,
        "ac1_current": ac1_current,
        "ac1_power": ac1_power,
        "ac1_frequency": ac1_frequency,
        "ac1_pf": ac1_pf,

        "ac2_voltage": ac2_voltage,
        "ac2_current": ac2_current,
        "ac2_power": ac2_power,
        "ac2_frequency": ac2_frequency,
        "ac2_pf": ac2_pf
    }

# =========================================================
# MQTT PUBLISH
# =========================================================

def publish_mqtt(dc, ac):

    payload = {

        # DC DATA
        "dc_voltage": dc["battery_voltage"],
        "dc_current": dc["battery_current"],
        "dc_power": dc["battery_power"],

        "soc": dc["soc"],
        "soh": dc["soh"],

        # AC METER 1
        "ac1_voltage": ac["ac1_voltage"],
        "ac1_current": ac["ac1_current"],
        "ac1_power": ac["ac1_power"],
        "ac1_frequency": ac["ac1_frequency"],
        "ac1_power_factor": ac["ac1_pf"],

        # AC METER 2
        "ac2_voltage": ac["ac2_voltage"],
        "ac2_current": ac["ac2_current"],
        "ac2_power": ac["ac2_power"],
        "ac2_frequency": ac["ac2_frequency"],
        "ac2_power_factor": ac["ac2_pf"],

        "timestamp": time.time()
    }

    mqtt_client.publish(
        MQTT_TOPIC,
        json.dumps(payload)
    )

    print("\nMQTT Published")
    print(json.dumps(payload, indent=2))

# =========================================================
# THINGSPEAK UPLOAD
# =========================================================

def upload_dc_thingspeak(dc):

    global battery_energy
    global solar_energy

    battery_energy += dc["battery_power"] / 3600.0
    solar_energy += dc["solar_power"] / 3600.0

    payload = {
        "api_key": DC_WRITE_API,

        # Feeder 2 Battery
        "field1": dc["battery_voltage"],
        "field2": dc["solar_voltage"],

        "field3": dc["battery_current"],
        "field4": dc["solar_current"],

        "field5": dc["battery_power"],
        "field6": dc["solar_power"],

        "field7": round(battery_energy, 3),
        "field8": round(solar_energy, 3)
    }

    response = requests.post(
        THINGSPEAK_URL,
        data=payload
    )

    print("DC ThingSpeak:", response.text)


def upload_ac_thingspeak(ac):

    global ac1_energy
    global ac2_energy

    ac1_energy += ac["ac1_power"] / 3600.0
    ac2_energy += ac["ac2_power"] / 3600.0

    payload = {
        "api_key": AC_WRITE_API,

        # Feeder 3
        "field1": ac["ac1_voltage"],
        "field2": ac["ac2_voltage"],

        "field3": ac["ac1_current"],
        "field4": ac["ac2_current"],

        "field5": ac["ac1_power"],
        "field6": ac["ac2_power"],

        "field7": round(ac1_energy, 3),
        "field8": round(ac2_energy, 3)
    }

    response = requests.post(
        THINGSPEAK_URL,
        data=payload
    )

    print("AC ThingSpeak:", response.text)

# =========================================================
# MAIN LOOP
# =========================================================

print("Starting Solar Microgrid Data Simulator...")

last_thingspeak = 0

while True:

    dc_data = generate_dc_values()
    ac_data = generate_ac_values()

    # MQTT EVERY SECOND
    publish_mqtt(dc_data, ac_data)

    # THINGSPEAK EVERY 15 SEC
    current_time = time.time()

    if current_time - last_thingspeak >= 15:

        upload_dc_thingspeak(dc_data)
        upload_ac_thingspeak(ac_data)

        last_thingspeak = current_time

    time.sleep(1)