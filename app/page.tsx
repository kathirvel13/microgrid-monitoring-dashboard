"use client"

import { useEffect, useState } from "react"
import { Battery, Zap, Gauge, Activity, AlertTriangle, Plug, WifiOff } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { KPITile } from "@/components/dashboard/kpi-tile"
import { EnergySankey } from "@/components/dashboard/energy-sankey"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { BatteryHealth } from "@/components/dashboard/battery-health"
import { DataLogPanel } from "@/components/dashboard/data-log-panel"
import { TimeSeriesChart } from "@/components/charts/time-series-chart"
import { ConnectionStatus } from "@/components/dashboard/connection-status"
import { useEnergyStore } from "@/lib/energy-store"
import { useMqtt } from "@/hooks/use-mqtt"
import { useThingSpeak } from "@/hooks/use-thingspeak"

export default function DashboardPage() {
  const { 
    kpis, 
    energyFlow, 
    alerts, 
    batteryData, 
    lastKnownBatteryData,
    connection,
  } = useEnergyStore()
  
  // Initialize MQTT connection for real-time data
  useMqtt()
  
  // Initialize ThingSpeak for historical data
  const { isLoading: tsLoading } = useThingSpeak(100)
  
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isOnline = connection.mqtt && batteryData !== null

  // Helper to format values or show "-" when offline
  const formatValue = (value: number | null, decimals: number = 1): string => {
    if (value === null) return "-"
    return value.toFixed(decimals)
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="pt-16 lg:ml-64">
        <div className="p-4 lg:p-6">
          {/* Page Title with Connection Status */}
          <div className="mb-4 flex flex-col gap-2 lg:mb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider text-foreground lg:text-2xl">
                System Overview
              </h1>
              <p className="text-xs text-muted-foreground lg:text-sm">
                {isOnline ? (
                  <span className="flex items-center gap-1 text-secondary">
                    Real-time hardware data via MQTT
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-destructive">
                    <WifiOff className="h-3 w-3" />
                    Hardware Offline - Waiting for connection
                  </span>
                )}
              </p>
            </div>
            <ConnectionStatus />
          </div>

          {/* Offline Banner */}
          {!isOnline && mounted && (
            <div className="mb-4 flex items-center gap-3 border border-destructive/50 bg-destructive/10 px-4 py-3 lg:mb-6">
              <WifiOff className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Hardware Not Connected</p>
                <p className="text-xs text-muted-foreground">
                  {connection.lastMqttMessage 
                    ? `Last data received: ${new Date(connection.lastMqttMessage).toLocaleString()}`
                    : "No data received yet. Start your Raspberry Pi with pzem_read.py to see live data."
                  }
                </p>
              </div>
            </div>
          )}

          {/* KPI Tiles */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mb-6 lg:grid-cols-6 lg:gap-4">
            <KPITile
              title="DC Power"
              value={formatValue(kpis.dcPowerW)}
              unit="W"
              icon={Battery}
              trend={kpis.dcPowerW !== null && kpis.dcPowerW > 0 ? "up" : "neutral"}
              status={!isOnline ? "offline" : kpis.dcPowerW !== null && kpis.dcPowerW > 0 ? "ok" : "warning"}
            />
            <KPITile
              title="AC1 Power"
              value={formatValue(kpis.ac1PowerW)}
              unit="W"
              icon={Zap}
              trend="neutral"
              trendValue={kpis.ac1Voltage !== null ? `${kpis.ac1Voltage.toFixed(0)}V` : undefined}
              status={!isOnline ? "offline" : "ok"}
            />
            <KPITile
              title="Battery SoC"
              value={formatValue(kpis.batterySocPct, 0)}
              unit="%"
              icon={Gauge}
              trend={kpis.batterySocPct !== null && kpis.batterySocPct > 50 ? "up" : "down"}
              status={!isOnline ? "offline" : kpis.batterySocPct !== null && kpis.batterySocPct < 20 ? "critical" : kpis.batterySocPct !== null && kpis.batterySocPct < 40 ? "warning" : "ok"}
            />
            <KPITile
              title="DC Voltage"
              value={formatValue(kpis.dcVoltage, 2)}
              unit="V"
              icon={Activity}
              trend={kpis.dcVoltage !== null && kpis.dcVoltage > 11.5 ? "up" : kpis.dcVoltage !== null && kpis.dcVoltage < 10.5 ? "down" : "neutral"}
              trendValue="11.1V nom"
              status={!isOnline ? "offline" : kpis.dcVoltage !== null && kpis.dcVoltage < 10.0 ? "critical" : kpis.dcVoltage !== null && kpis.dcVoltage < 10.5 ? "warning" : "ok"}
            />
            <KPITile
              title="Power Source"
              value={kpis.powerSource ?? "-"}
              unit=""
              icon={Plug}
              status={!isOnline ? "offline" : "ok"}
            />
            <KPITile
              title="Alerts"
              value={activeAlerts.toString()}
              unit="active"
              icon={AlertTriangle}
              status={activeAlerts > 3 ? "critical" : activeAlerts > 0 ? "warning" : "ok"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            {/* Left Column - Charts */}
            <div className="space-y-4 lg:col-span-2 lg:space-y-6">
              <EnergySankey flow={energyFlow} isOffline={!isOnline} />

              <div className="border border-border bg-card p-4">
                <h3 className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Power History (ThingSpeak)</span>
                  {tsLoading && (
                    <span className="text-[10px] font-normal text-muted-foreground">Loading...</span>
                  )}
                </h3>
                <TimeSeriesChart />
              </div>
            </div>

            {/* Right Column - Panels */}
            <div className="space-y-4 lg:space-y-6">
              <AlertsPanel />
              <BatteryHealth
                soc={kpis.batterySocPct}
                soh={kpis.batterySohPct}
                voltage={kpis.dcVoltage}
                current={batteryData?.dc_current ?? lastKnownBatteryData?.dc_current ?? null}
                health={batteryData?.health ?? lastKnownBatteryData?.health ?? null}
                isOffline={!isOnline}
              />
              <DataLogPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
