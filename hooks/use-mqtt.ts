"use client"

import { useEffect, useRef, useCallback } from "react"
import mqtt from "mqtt"
import { useEnergyStore } from "@/lib/energy-store"
import type { BatteryData, PowerData, PowerSource, Priority, MqttBatteryPayload } from "@/lib/types"

// MQTT Configuration
const MQTT_BROKER = "wss://broker.emqx.io:8084/mqtt" // WebSocket secure
const MQTT_TOPIC = "battery/data" // New topic as per your instructions

// Battery specs for health calculation (6Ah, 11.1V 3S Li-ion)
const BATTERY_FULL_VOLTAGE = 12.6
const BATTERY_EMPTY_VOLTAGE = 9.0

function getBatteryHealth(soc: number, voltage: number): string {
  if (voltage < 9.5 || soc < 10) return "Critical"
  if (voltage < 10.5 || soc < 30) return "Low"
  if (voltage < 11.0 || soc < 50) return "Moderate"
  return "Good"
}

function determinePowerSource(dcPower: number, ac1Power: number, ac2Power: number): PowerSource {
  const totalAC = ac1Power + ac2Power
  if (dcPower > 0 && totalAC > 0) {
    if (dcPower > totalAC * 0.8) return "BATTERY"
    if (dcPower > 1) return "HYBRID"
  }
  return "GRID"
}

function determinePriority(dcVoltage: number, soc: number): Priority {
  if (soc > 70 && dcVoltage > 11.5) return "HIGH_PRIORITY"
  if (soc > 40 && dcVoltage > 10.5) return "MEDIUM_PRIORITY"
  return "LOW_PRIORITY"
}

export function useMqtt() {
  const clientRef = useRef<mqtt.MqttClient | null>(null)
  
  const {
    setBatteryData,
    setPowerData,
    setMqttConnection,
    addDataLogEntry,
    addAlert,
  } = useEnergyStore()

  const handleMessage = useCallback((topic: string, message: Buffer) => {
    try {
      const payload: MqttBatteryPayload = JSON.parse(message.toString())
      const now = payload.timestamp || new Date().toISOString()

      // Process battery data
      const batteryData: BatteryData = {
        dc_voltage: payload.dc_voltage ?? 0,
        dc_current: payload.dc_current ?? 0,
        dc_power: payload.dc_power ?? 0,
        soc: payload.soc ?? 0,
        soh: payload.soh ?? 100,
        health: getBatteryHealth(payload.soc ?? 0, payload.dc_voltage ?? 0),
        timestamp: now,
      }
      setBatteryData(batteryData)

      // Process AC power data
      const powerData: PowerData = {
        ac1_voltage: payload.ac1_voltage ?? 0,
        ac1_current: payload.ac1_current ?? 0,
        ac1_power: payload.ac1_power ?? 0,
        ac1_frequency: payload.ac1_frequency ?? 50,
        ac1_pf: payload.ac1_pf ?? 1,
        ac2_voltage: payload.ac2_voltage ?? 0,
        ac2_current: payload.ac2_current ?? 0,
        ac2_power: payload.ac2_power ?? 0,
        ac2_frequency: payload.ac2_frequency ?? 50,
        ac2_pf: payload.ac2_pf ?? 1,
        source: determinePowerSource(payload.dc_power ?? 0, payload.ac1_power ?? 0, payload.ac2_power ?? 0),
        priority: determinePriority(payload.dc_voltage ?? 0, payload.soc ?? 0),
        timestamp: now,
      }
      setPowerData(powerData)

      // Add to data log
      addDataLogEntry({
        timestamp: now,
        source: "mqtt",
        topic,
        data: batteryData,
      })

      // Check for alerts
      if (payload.soc !== undefined && payload.soc < 20) {
        addAlert({
          type: "low_soc",
          severity: "warning",
          message: `Battery SOC low: ${payload.soc.toFixed(1)}%`,
          timestamp: now,
          acknowledged: false,
          value: payload.soc,
        })
      }
      if (payload.dc_voltage !== undefined && payload.dc_voltage < 10.0) {
        addAlert({
          type: "low_voltage",
          severity: "critical",
          message: `DC voltage critically low: ${payload.dc_voltage.toFixed(2)}V`,
          timestamp: now,
          acknowledged: false,
          value: payload.dc_voltage,
        })
      }

    } catch (error) {
      console.error("[v0] MQTT parse error:", error)
    }
  }, [setBatteryData, setPowerData, addDataLogEntry, addAlert])

  useEffect(() => {
    // Connect to MQTT broker
    const client = mqtt.connect(MQTT_BROKER, {
      clientId: `iot-dashboard-${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
    })

    clientRef.current = client

    client.on("connect", () => {
      setMqttConnection(true)
      
      // Subscribe to the battery data topic
      client.subscribe(MQTT_TOPIC, { qos: 0 }, (err) => {
        if (err) {
          console.error("[v0] MQTT subscribe error:", err)
          setMqttConnection(false, err.message)
        }
      })
    })

    client.on("message", handleMessage)

    client.on("error", (err) => {
      console.error("[v0] MQTT error:", err)
      setMqttConnection(false, err.message)
    })

    client.on("close", () => {
      setMqttConnection(false)
    })

    client.on("reconnect", () => {
      // Reconnecting...
    })

    return () => {
      if (client) {
        client.unsubscribe(MQTT_TOPIC)
        client.end()
      }
    }
  }, [handleMessage, setMqttConnection])

  return {
    isConnected: clientRef.current?.connected ?? false,
  }
}
