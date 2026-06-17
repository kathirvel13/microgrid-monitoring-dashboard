"use client"

import { create } from "zustand"
import type {
  BatteryData,
  PowerData,
  Alert,
  KPIs,
  EnergyFlow,
  ConnectionStatus,
  DataLogEntry,
  HistoricalDataPoint,
} from "./types"

interface EnergyStore {
  // Real-time data (null when not connected)
  batteryData: BatteryData | null
  powerData: PowerData | null
  
  // Last known data (for displaying when offline)
  lastKnownBatteryData: BatteryData | null
  lastKnownPowerData: PowerData | null
  
  // Historical data from ThingSpeak
  historicalData: HistoricalDataPoint[]
  
  // Alerts
  alerts: Alert[]
  
  // Data log (recent messages)
  dataLog: DataLogEntry[]
  
  // Connection status
  connection: ConnectionStatus
  
  // Derived KPIs
  kpis: KPIs
  
  // Energy flow for visualization
  energyFlow: EnergyFlow
  
  // Actions
  setBatteryData: (data: BatteryData) => void
  setPowerData: (data: PowerData) => void
  setHistoricalData: (data: HistoricalDataPoint[]) => void
  addAlert: (alert: Omit<Alert, "id">) => void
  acknowledgeAlert: (alertId: string) => void
  clearAlerts: () => void
  setMqttConnection: (connected: boolean, error?: string | null) => void
  setThingSpeakConnection: (connected: boolean, error?: string | null) => void
  addDataLogEntry: (entry: Omit<DataLogEntry, "id">) => void
}

function generateAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Calculate KPIs - returns null values when no data
function calculateKPIs(battery: BatteryData | null, power: PowerData | null, connected: boolean, lastUpdate: string | null): KPIs {
  return {
    dcPowerW: battery?.dc_power ?? null,
    ac1PowerW: power?.ac1_power ?? null,
    ac2PowerW: power?.ac2_power ?? null,
    totalLoadW: power ? (power.ac1_power + power.ac2_power) : null,
    batterySocPct: battery?.soc ?? null,
    batterySohPct: battery?.soh ?? null,
    dcVoltage: battery?.dc_voltage ?? null,
    dcCurrent: battery?.dc_current ?? null,
    ac1Voltage: power?.ac1_voltage ?? null,
    ac1Frequency: power?.ac1_frequency ?? null,
    ac1PowerFactor: power?.ac1_pf ?? null,
    powerSource: power?.source ?? null,
    priority: power?.priority ?? null,
    isConnected: connected,
    lastUpdate: lastUpdate,
  }
}

function calculateEnergyFlow(battery: BatteryData | null, power: PowerData | null): EnergyFlow {
  if (!battery && !power) {
    return {
      batteryToAC1: 0,
      batteryToAC2: 0,
      gridToAC1: 0,
      gridToAC2: 0,
      totalGeneration: 0,
      totalConsumption: 0,
    }
  }
  
  const dcPower = battery?.dc_power ?? 0
  const ac1Power = power?.ac1_power ?? 0
  const ac2Power = power?.ac2_power ?? 0
  const source = power?.source ?? "GRID"
  
  if (source === "BATTERY") {
    return {
      batteryToAC1: ac1Power,
      batteryToAC2: ac2Power,
      gridToAC1: 0,
      gridToAC2: 0,
      totalGeneration: dcPower,
      totalConsumption: ac1Power + ac2Power,
    }
  } else if (source === "HYBRID") {
    const batteryContribution = Math.min(dcPower, ac1Power + ac2Power) * 0.5
    return {
      batteryToAC1: batteryContribution * (ac1Power / (ac1Power + ac2Power || 1)),
      batteryToAC2: batteryContribution * (ac2Power / (ac1Power + ac2Power || 1)),
      gridToAC1: ac1Power - batteryContribution * (ac1Power / (ac1Power + ac2Power || 1)),
      gridToAC2: ac2Power - batteryContribution * (ac2Power / (ac1Power + ac2Power || 1)),
      totalGeneration: dcPower,
      totalConsumption: ac1Power + ac2Power,
    }
  } else {
    return {
      batteryToAC1: 0,
      batteryToAC2: 0,
      gridToAC1: ac1Power,
      gridToAC2: ac2Power,
      totalGeneration: dcPower,
      totalConsumption: ac1Power + ac2Power,
    }
  }
}

export const useEnergyStore = create<EnergyStore>((set, get) => ({
  // Initialize with null (no data until hardware connects)
  batteryData: null,
  powerData: null,
  lastKnownBatteryData: null,
  lastKnownPowerData: null,
  historicalData: [],
  alerts: [],
  dataLog: [],
  connection: {
    mqtt: false,
    thingspeak: false,
    lastMqttMessage: null,
    lastThingSpeakFetch: null,
    mqttError: null,
    thingspeakError: null,
  },
  kpis: calculateKPIs(null, null, false, null),
  energyFlow: calculateEnergyFlow(null, null),

  setBatteryData: (data) => {
    const { powerData, connection } = get()
    set({
      batteryData: data,
      lastKnownBatteryData: data,
      kpis: calculateKPIs(data, powerData, true, data.timestamp),
      energyFlow: calculateEnergyFlow(data, powerData),
      connection: {
        ...connection,
        mqtt: true,
        lastMqttMessage: data.timestamp,
      },
    })
  },

  setPowerData: (data) => {
    const { batteryData, connection } = get()
    set({
      powerData: data,
      lastKnownPowerData: data,
      kpis: calculateKPIs(batteryData, data, true, data.timestamp),
      energyFlow: calculateEnergyFlow(batteryData, data),
      connection: {
        ...connection,
        mqtt: true,
        lastMqttMessage: data.timestamp,
      },
    })
  },

  setHistoricalData: (data) => {
    set({
      historicalData: data,
      connection: {
        ...get().connection,
        lastThingSpeakFetch: new Date().toISOString(),
      },
    })
  },

  addAlert: (alert) => {
    set({
      alerts: [...get().alerts, { ...alert, id: generateAlertId() }],
    })
  },

  acknowledgeAlert: (alertId) => {
    set({
      alerts: get().alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ),
    })
  },

  clearAlerts: () => {
    set({ alerts: [] })
  },

  setMqttConnection: (connected, error = null) => {
    const { lastKnownBatteryData, lastKnownPowerData, connection } = get()
    
    // When disconnected, clear current data but keep last known
    if (!connected) {
      set({
        batteryData: null,
        powerData: null,
        connection: {
          ...connection,
          mqtt: false,
          mqttError: error,
        },
        kpis: calculateKPIs(null, null, false, connection.lastMqttMessage),
        energyFlow: calculateEnergyFlow(null, null),
      })
    } else {
      set({
        connection: {
          ...connection,
          mqtt: true,
          mqttError: null,
        },
      })
    }
  },

  setThingSpeakConnection: (connected, error = null) => {
    set({
      connection: {
        ...get().connection,
        thingspeak: connected,
        thingspeakError: error,
      },
    })
  },

  addDataLogEntry: (entry) => {
    const log = get().dataLog
    const newEntry = { ...entry, id: generateLogId() }
    set({
      dataLog: [newEntry, ...log].slice(0, 100),
    })
  },
}))
