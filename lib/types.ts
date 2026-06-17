// Hardware data types matching your Python scripts

export type AlertSeverity = "info" | "warning" | "critical"
export type AlertType =
  | "low_soc"
  | "low_voltage"
  | "overcurrent"
  | "high_power"
  | "sensor_offline"
  | "mqtt_disconnect"
  | "thingspeak_error"

export type PowerSource = "GRID" | "BATTERY" | "HYBRID"
export type Priority = "HIGH_PRIORITY" | "MEDIUM_PRIORITY" | "LOW_PRIORITY" | "UNKNOWN"

// Battery data from MQTT topic: battery/data
export interface BatteryData {
  dc_voltage: number    // DC voltage
  dc_current: number    // DC current
  dc_power: number      // DC power
  soc: number           // State of Charge (%)
  soh: number           // State of Health (%)
  health: string        // "Good", "Moderate", "Low", "Critical"
  timestamp: string     // ISO timestamp
}

// Power data from MQTT topic: battery/data (AC meters)
export interface PowerData {
  ac1_voltage: number     // PZEM AC Meter 1
  ac1_current: number
  ac1_power: number
  ac1_frequency: number
  ac1_pf: number          // Power Factor
  ac2_voltage: number     // PZEM AC Meter 2
  ac2_current: number
  ac2_power: number
  ac2_frequency: number
  ac2_pf: number
  priority: Priority
  source: PowerSource
  timestamp: string
}

// MQTT payload structure from battery/data topic
export interface MqttBatteryPayload {
  dc_voltage: number
  dc_current: number
  dc_power: number
  soc: number
  soh: number
  ac1_voltage: number
  ac1_current: number
  ac1_power: number
  ac1_frequency: number
  ac1_pf: number
  ac2_voltage: number
  ac2_current: number
  ac2_power: number
  ac2_frequency: number
  ac2_pf: number
  timestamp?: string
}

// ThingSpeak AC Channel (3387437)
// Fields: field1=voltage3, field2=voltage4, field3=current3, field4=current4, 
//         field5=power3, field6=power4, field7=energy3, field8=energy4
export interface ThingSpeakACEntry {
  created_at: string
  entry_id: number
  field1: string | null  // voltage3 (AC1 voltage)
  field2: string | null  // voltage4 (AC2 voltage)
  field3: string | null  // current3 (AC1 current)
  field4: string | null  // current4 (AC2 current)
  field5: string | null  // power3 (AC1 power)
  field6: string | null  // power4 (AC2 power)
  field7: string | null  // energy3 (AC1 energy)
  field8: string | null  // energy4 (AC2 energy)
}

// ThingSpeak DC Channel (3387439)
// Fields: field1=bvoltage, field2=svoltage, field3=bcurrent, field4=scurrent,
//         field5=bpower, field6=spower, field7=benergy, field8=senergy
export interface ThingSpeakDCEntry {
  created_at: string
  entry_id: number
  field1: string | null  // bvoltage (battery voltage)
  field2: string | null  // svoltage (solar voltage)
  field3: string | null  // bcurrent (battery current)
  field4: string | null  // scurrent (solar current)
  field5: string | null  // bpower (battery power)
  field6: string | null  // spower (solar power)
  field7: string | null  // benergy (battery energy)
  field8: string | null  // senergy (solar energy)
}

// Parsed historical data for charts (combined from both channels)
export interface HistoricalDataPoint {
  timestamp: string
  // DC data
  dcVoltage: number
  dcCurrent: number
  dcPower: number
  dcEnergy: number
  // Solar data (if available)
  solarVoltage: number
  solarCurrent: number
  solarPower: number
  solarEnergy: number
  // AC1 data
  ac1Voltage: number
  ac1Current: number
  ac1Power: number
  ac1Energy: number
  // AC2 data
  ac2Voltage: number
  ac2Current: number
  ac2Power: number
  ac2Energy: number
  // Calculated
  soc?: number
  soh?: number
}

// Combined real-time data state
export interface RealtimeData {
  battery: BatteryData | null
  power: PowerData | null
  lastUpdate: string | null
}

// Alert interface
export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  message: string
  timestamp: string
  acknowledged: boolean
  value?: number
}

// KPIs derived from hardware data (null when offline/no data)
export interface KPIs {
  dcPowerW: number | null
  ac1PowerW: number | null
  ac2PowerW: number | null
  totalLoadW: number | null
  batterySocPct: number | null
  batterySohPct: number | null
  dcVoltage: number | null
  dcCurrent: number | null
  ac1Voltage: number | null
  ac1Frequency: number | null
  ac1PowerFactor: number | null
  powerSource: PowerSource | null
  priority: Priority | null
  isConnected: boolean
  lastUpdate: string | null
}

// Energy flow for Sankey diagram
export interface EnergyFlow {
  batteryToAC1: number
  batteryToAC2: number
  gridToAC1: number
  gridToAC2: number
  totalGeneration: number
  totalConsumption: number
}

// Connection status
export interface ConnectionStatus {
  mqtt: boolean
  thingspeak: boolean
  lastMqttMessage: string | null
  lastThingSpeakFetch: string | null
  mqttError: string | null
  thingspeakError: string | null
}

// Data log entry for the data log panel
export interface DataLogEntry {
  id: string
  timestamp: string
  source: "mqtt" | "thingspeak"
  topic?: string
  data: BatteryData | PowerData | Record<string, unknown>
}
