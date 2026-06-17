// Node types and telemetry interfaces
export type NodeType = "power" | "battery" | "pv"
export type AlertSeverity = "info" | "warning" | "critical"
export type AlertType =
  | "soiling"
  | "high_temp"
  | "low_soc"
  | "sensor_offline"
  | "inverter_fault"
  | "low_voltage"
  | "overcurrent"
  | "optimizer_action_failed"

export interface NodeMetadata {
  nodeId: string
  type: NodeType
  location: string
  phases?: number
  lastSeen: string
  firmwareVersion: string
  batteryBMS?: string
  status: "ok" | "warning" | "offline"
}

export interface BaseTelemetry {
  nodeId: string
  type: NodeType
  ts: string
  seq: number
  rssi: number
}

export interface PowerTelemetry extends BaseTelemetry {
  type: "power"
  phase: number
  voltage_v: number
  current_a: number
  active_power_w: number
  apparent_power_va: number
  energy_wh: number
  power_factor: number
  frequency_hz: number
  node_batt_pct: number
}

export interface BatteryTelemetry extends BaseTelemetry {
  type: "battery"
  voltage_v: number
  current_a: number
  soc_pct: number
  temperature_c: number
  cycle_count: number
  capacity_ah_est: number
  capacity_fade_pct: number
}

export interface PVTelemetry extends BaseTelemetry {
  type: "pv"
  panel_temp_c: number
  irradiance_w_m2: number
  soiling_index: number
  pv_power_w: number
}

export type Telemetry = PowerTelemetry | BatteryTelemetry | PVTelemetry

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  nodeId: string
  message: string
  timestamp: string
  acknowledged: boolean
  recommendedAction: string
}

export interface OptimizerDecision {
  id: string
  timestamp: string
  action: string
  reason: string
  confidence: number
  status: "pending" | "accepted" | "rejected"
}

export interface KPIs {
  pvPowerKw: number
  totalLoadKw: number
  batterySocPct: number
  gridImportExportKw: number
  systemUptime: number
  activeAlerts: number
}

export interface EnergyFlow {
  pvToLoad: number
  pvToBattery: number
  batteryToLoad: number
  gridToSystem: number
  systemToGrid: number
}
