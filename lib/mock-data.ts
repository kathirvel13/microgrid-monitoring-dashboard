import type {
  NodeMetadata,
  PowerTelemetry,
  BatteryTelemetry,
  PVTelemetry,
  Telemetry,
  Alert,
  OptimizerDecision,
  KPIs,
  EnergyFlow,
} from "./types"

// Generate realistic mock nodes
export const mockNodes: NodeMetadata[] = [
  {
    nodeId: "power-001",
    type: "power",
    location: "Village A - Feeder 1",
    phases: 3,
    lastSeen: new Date().toISOString(),
    firmwareVersion: "v1.2.3",
    status: "ok",
  },
  {
    nodeId: "power-002",
    type: "power",
    location: "Village A - Feeder 2",
    phases: 3,
    lastSeen: new Date().toISOString(),
    firmwareVersion: "v1.2.3",
    status: "ok",
  },
  {
    nodeId: "power-003",
    type: "power",
    location: "Village B - Main",
    phases: 3,
    lastSeen: new Date().toISOString(),
    firmwareVersion: "v1.2.2",
    status: "warning",
  },
  {
    nodeId: "power-004",
    type: "power",
    location: "Village B - Secondary",
    phases: 3,
    lastSeen: new Date(Date.now() - 300000).toISOString(),
    firmwareVersion: "v1.2.1",
    status: "offline",
  },
  {
    nodeId: "battery-001",
    type: "battery",
    location: "Village A - Storage",
    lastSeen: new Date().toISOString(),
    firmwareVersion: "v2.0.1",
    batteryBMS: "BMS-LFP-48",
    status: "ok",
  },
  {
    nodeId: "battery-002",
    type: "battery",
    location: "Village B - Storage",
    lastSeen: new Date().toISOString(),
    firmwareVersion: "v2.0.0",
    batteryBMS: "BMS-LFP-48",
    status: "ok",
  },
  {
    nodeId: "pv-001",
    type: "pv",
    location: "Village A - Array 1",
    lastSeen: new Date().toISOString(),
    firmwareVersion: "v1.1.0",
    status: "ok",
  },
  {
    nodeId: "pv-002",
    type: "pv",
    location: "Village A - Array 2",
    lastSeen: new Date().toISOString(),
    firmwareVersion: "v1.1.0",
    status: "warning",
  },
  {
    nodeId: "pv-003",
    type: "pv",
    location: "Village B - Array 1",
    lastSeen: new Date().toISOString(),
    firmwareVersion: "v1.0.9",
    status: "ok",
  },
]

// Generate telemetry with realistic daily patterns
function getHourFactor(): number {
  const hour = new Date().getHours()
  // Solar curve: peak at noon
  if (hour >= 6 && hour <= 18) {
    return Math.sin(((hour - 6) / 12) * Math.PI)
  }
  return 0
}

function getLoadFactor(): number {
  const hour = new Date().getHours()
  // Load curve: morning and evening peaks
  if (hour >= 6 && hour <= 9) return 0.7 + Math.random() * 0.2
  if (hour >= 17 && hour <= 21) return 0.8 + Math.random() * 0.2
  if (hour >= 10 && hour <= 16) return 0.4 + Math.random() * 0.2
  return 0.2 + Math.random() * 0.1
}

export function generatePowerTelemetry(nodeId: string, phase = 1): PowerTelemetry {
  const loadFactor = getLoadFactor()
  const basePower = 2000 + Math.random() * 1500
  return {
    nodeId,
    type: "power",
    ts: new Date().toISOString(),
    seq: Math.floor(Math.random() * 10000),
    phase,
    voltage_v: 228 + Math.random() * 5,
    current_a: (basePower * loadFactor) / 230,
    active_power_w: basePower * loadFactor,
    apparent_power_va: basePower * loadFactor * 1.02,
    energy_wh: 1000000 + Math.floor(Math.random() * 500000),
    power_factor: 0.95 + Math.random() * 0.04,
    frequency_hz: 49.95 + Math.random() * 0.1,
    rssi: -70 - Math.floor(Math.random() * 20),
    node_batt_pct: 80 + Math.floor(Math.random() * 20),
  }
}

export function generateBatteryTelemetry(nodeId: string): BatteryTelemetry {
  const hourFactor = getHourFactor()
  const isCharging = hourFactor > 0.3
  return {
    nodeId,
    type: "battery",
    ts: new Date().toISOString(),
    seq: Math.floor(Math.random() * 10000),
    voltage_v: 48 + Math.random() * 6,
    current_a: isCharging ? -(5 + Math.random() * 10) : 3 + Math.random() * 8,
    soc_pct: 40 + Math.floor(Math.random() * 50),
    temperature_c: 25 + Math.random() * 10,
    cycle_count: 200 + Math.floor(Math.random() * 100),
    capacity_ah_est: 170 + Math.floor(Math.random() * 20),
    capacity_fade_pct: 5 + Math.random() * 10,
    rssi: -70 - Math.floor(Math.random() * 20),
  }
}

export function generatePVTelemetry(nodeId: string): PVTelemetry {
  const hourFactor = getHourFactor()
  const maxPower = 5000
  return {
    nodeId,
    type: "pv",
    ts: new Date().toISOString(),
    seq: Math.floor(Math.random() * 10000),
    panel_temp_c: 25 + hourFactor * 25 + Math.random() * 5,
    irradiance_w_m2: Math.floor(hourFactor * 1000 + Math.random() * 50),
    soiling_index: 0.75 + Math.random() * 0.25,
    pv_power_w: Math.floor(hourFactor * maxPower * (0.85 + Math.random() * 0.15)),
    rssi: -70 - Math.floor(Math.random() * 20),
  }
}

export function generateTelemetry(node: NodeMetadata): Telemetry {
  switch (node.type) {
    case "power":
      return generatePowerTelemetry(node.nodeId, 1)
    case "battery":
      return generateBatteryTelemetry(node.nodeId)
    case "pv":
      return generatePVTelemetry(node.nodeId)
  }
}

export function generateKPIs(): KPIs {
  const hourFactor = getHourFactor()
  const pvPower = hourFactor * 12 + Math.random() * 2
  const load = getLoadFactor() * 8 + Math.random() * 2
  const gridFlow = load - pvPower * 0.7
  return {
    pvPowerKw: Math.max(0, pvPower),
    totalLoadKw: load,
    batterySocPct: 40 + Math.floor(Math.random() * 50),
    gridImportExportKw: gridFlow,
    systemUptime: 99.2 + Math.random() * 0.7,
    activeAlerts: Math.floor(Math.random() * 5),
  }
}

export function generateEnergyFlow(): EnergyFlow {
  const hourFactor = getHourFactor()
  const pvTotal = hourFactor * 12
  return {
    pvToLoad: pvTotal * 0.6,
    pvToBattery: pvTotal * 0.3,
    batteryToLoad: hourFactor < 0.3 ? 2 + Math.random() * 3 : 0,
    gridToSystem: hourFactor < 0.2 ? 3 + Math.random() * 2 : 0,
    systemToGrid: pvTotal > 8 ? pvTotal * 0.1 : 0,
  }
}

export const mockAlerts: Alert[] = [
  {
    id: "alert-001",
    type: "soiling",
    severity: "warning",
    nodeId: "pv-002",
    message: "Soiling index below threshold (0.78)",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    acknowledged: false,
    recommendedAction: "Schedule panel cleaning within 7 days",
  },
  {
    id: "alert-002",
    type: "sensor_offline",
    severity: "critical",
    nodeId: "power-004",
    message: "Node offline for 5+ minutes",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    acknowledged: false,
    recommendedAction: "Check node connectivity and power supply",
  },
  {
    id: "alert-003",
    type: "high_temp",
    severity: "warning",
    nodeId: "battery-001",
    message: "Battery temperature elevated (38°C)",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    acknowledged: true,
    recommendedAction: "Monitor temperature, ensure ventilation",
  },
  {
    id: "alert-004",
    type: "low_soc",
    severity: "info",
    nodeId: "battery-002",
    message: "Battery SoC at 25%",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    acknowledged: false,
    recommendedAction: "Reduce non-essential loads if needed",
  },
]

export const mockOptimizerDecisions: OptimizerDecision[] = [
  {
    id: "opt-001",
    timestamp: new Date(Date.now() - 60000).toISOString(),
    action: "Dispatched 2.1 kW from battery to load",
    reason: "Grid tariff peak detected, battery SoC sufficient",
    confidence: 0.92,
    status: "accepted",
  },
  {
    id: "opt-002",
    timestamp: new Date(Date.now() - 180000).toISOString(),
    action: "Increased battery charge rate to 8A",
    reason: "Excess PV generation, battery SoC below target",
    confidence: 0.88,
    status: "accepted",
  },
  {
    id: "opt-003",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    action: "Shed low-priority load L7 (0.5 kW)",
    reason: "Approaching battery minimum SoC threshold",
    confidence: 0.75,
    status: "pending",
  },
  {
    id: "opt-004",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    action: "Reduced export to grid by 1.2 kW",
    reason: "Battery priority charging enabled",
    confidence: 0.85,
    status: "accepted",
  },
  {
    id: "opt-005",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    action: "Enabled grid import (0.8 kW)",
    reason: "Cloud cover detected, PV output dropping",
    confidence: 0.81,
    status: "accepted",
  },
]

// Generate time-series historical data
export function generateHistoricalData(hours = 24, intervalMinutes = 15) {
  const data: { timestamp: string; pvPower: number; load: number; batterySoc: number; gridFlow: number }[] = []
  const now = Date.now()
  const intervals = (hours * 60) / intervalMinutes

  for (let i = intervals; i >= 0; i--) {
    const timestamp = new Date(now - i * intervalMinutes * 60000)
    const hour = timestamp.getHours()
    const hourFactor = hour >= 6 && hour <= 18 ? Math.sin(((hour - 6) / 12) * Math.PI) : 0
    const loadFactor =
      hour >= 6 && hour <= 9 ? 0.7 : hour >= 17 && hour <= 21 ? 0.8 : hour >= 10 && hour <= 16 ? 0.4 : 0.2

    const pvPower = hourFactor * 12 + (Math.random() - 0.5) * 2
    const load = loadFactor * 8 + (Math.random() - 0.5) * 1.5

    data.push({
      timestamp: timestamp.toISOString(),
      pvPower: Math.max(0, pvPower),
      load,
      batterySoc: 40 + Math.sin((i / intervals) * Math.PI * 2) * 30 + Math.random() * 10,
      gridFlow: load - pvPower * 0.7,
    })
  }

  return data
}
