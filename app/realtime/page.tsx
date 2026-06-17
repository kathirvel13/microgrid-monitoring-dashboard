"use client"

import { useEffect, useState } from "react"
import { Battery, Zap, Gauge, Activity, Wifi, WifiOff } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { cn } from "@/lib/utils"
import { useEnergyStore } from "@/lib/energy-store"
import { useMqtt } from "@/hooks/use-mqtt"

export default function RealtimePage() {
  const { 
    batteryData, 
    powerData, 
    dataLog,
    connection,
  } = useEnergyStore()
  
  // Initialize MQTT for real-time data
  useMqtt()
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isOnline = connection.mqtt && batteryData !== null

  const formatTime = (timestamp: string | null) => {
    if (!timestamp || !mounted) return "-"
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="pt-16 lg:ml-64">
        <div className="p-4 lg:p-6">
          {/* Page Title */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider text-foreground lg:text-2xl">
                Realtime Monitoring
              </h1>
              <p className="text-xs text-muted-foreground lg:text-sm">
                {isOnline ? (
                  <span className="flex items-center gap-1 text-secondary">
                    <Wifi className="h-3 w-3" />
                    Live hardware data via MQTT (broker.emqx.io)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-destructive">
                    <WifiOff className="h-3 w-3" />
                    Hardware Offline - Waiting for connection
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isOnline ? "animate-pulse bg-secondary" : "bg-destructive"}`} />
              <span className={cn(
                "text-sm font-medium",
                isOnline ? "text-secondary" : "text-destructive"
              )}>
                {isOnline ? "Live" : "Offline"}
              </span>
            </div>
          </div>

          {/* Offline Banner */}
          {!isOnline && mounted && (
            <div className="mb-6 flex items-center gap-3 border border-destructive/50 bg-destructive/10 px-4 py-3">
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

          {/* Live Data Cards */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Battery Data Card */}
            <div className={cn(
              "border bg-card p-4 lg:p-6",
              isOnline ? "border-border" : "border-muted/50"
            )}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className={cn("h-5 w-5", isOnline ? "text-secondary" : "text-muted-foreground")} />
                  <h2 className="text-sm font-bold uppercase tracking-wider">Battery Data</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  DC Meter (Slave 2/26)
                </span>
              </div>

              {batteryData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <MetricCard
                      label="DC Voltage"
                      value={batteryData.dc_voltage ? batteryData.dc_voltage.toFixed(2) : "-"}
                      unit="V"
                      icon={Activity}
                    />
                    <MetricCard
                      label="DC Current"
                      value={batteryData.dc_current ? batteryData.dc_current.toFixed(2) : "-"}
                      unit="A"
                      icon={Zap}
                    />
                    <MetricCard
                      label="DC Power"
                      value={batteryData.dc_power ? batteryData.dc_power.toFixed(1) : "-"}
                      unit="W"
                      icon={Zap}
                    />
                    <MetricCard
                      label="State of Charge"
                      value={batteryData.soc ? batteryData.soc.toFixed(0) : "-"}
                      unit="%"
                      icon={Gauge}
                      status={batteryData.soc && batteryData.soc < 20 ? "critical" : batteryData.soc && batteryData.soc < 40 ? "warning" : "ok"}
                    />
                    <MetricCard
                      label="State of Health"
                      value={batteryData.soh ? batteryData.soh.toFixed(1) : "-"}
                      unit="%"
                      icon={Battery}
                    />
                    <MetricCard
                      label="Health Status"
                      value={batteryData.health || "-"}
                      unit=""
                      icon={Battery}
                      status={batteryData.health === "Good" ? "ok" : batteryData.health === "Moderate" ? "warning" : "critical"}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last update: {formatTime(batteryData.timestamp)}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Battery className="mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Waiting for battery data...</p>
                  <p className="mt-1 text-xs text-muted-foreground">Start pzem_read.py on your Raspberry Pi</p>
                </div>
              )}
            </div>

            {/* Power Data Card */}
            <div className={cn(
              "border bg-card p-4 lg:p-6",
              isOnline ? "border-border" : "border-muted/50"
            )}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={cn("h-5 w-5", isOnline ? "text-chart-4" : "text-muted-foreground")} />
                  <h2 className="text-sm font-bold uppercase tracking-wider">AC Power Data</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  PZEM Meters (Slave 3-4)
                </span>
              </div>

              {powerData ? (
                <div className="space-y-4">
                  {/* AC Meter 1 */}
                  <div>
                    <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">AC Meter 1 (PZEM Slave 3/27)</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <MiniMetric label="Voltage" value={powerData.ac1_voltage ? `${powerData.ac1_voltage.toFixed(1)}V` : "-"} />
                      <MiniMetric label="Current" value={powerData.ac1_current ? `${powerData.ac1_current.toFixed(2)}A` : "-"} />
                      <MiniMetric label="Power" value={powerData.ac1_power ? `${powerData.ac1_power.toFixed(0)}W` : "-"} />
                      <MiniMetric label="Frequency" value={powerData.ac1_frequency ? `${powerData.ac1_frequency.toFixed(1)}Hz` : "-"} />
                      <MiniMetric label="PF" value={powerData.ac1_pf ? powerData.ac1_pf.toFixed(2) : "-"} />
                    </div>
                  </div>

                  {/* AC Meter 2 */}
                  <div>
                    <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">AC Meter 2 (PZEM Slave 4/28)</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <MiniMetric label="Voltage" value={powerData.ac2_voltage ? `${powerData.ac2_voltage.toFixed(1)}V` : "-"} />
                      <MiniMetric label="Current" value={powerData.ac2_current ? `${powerData.ac2_current.toFixed(2)}A` : "-"} />
                      <MiniMetric label="Power" value={powerData.ac2_power ? `${powerData.ac2_power.toFixed(0)}W` : "-"} />
                      <MiniMetric label="Frequency" value={powerData.ac2_frequency ? `${powerData.ac2_frequency.toFixed(1)}Hz` : "-"} />
                      <MiniMetric label="PF" value={powerData.ac2_pf ? powerData.ac2_pf.toFixed(2) : "-"} />
                    </div>
                  </div>

                  {/* Priority & Source */}
                  <div className="flex items-center gap-4 border-t border-border pt-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Source: </span>
                      <span className={cn(
                        "font-mono text-sm font-bold",
                        powerData.source === "BATTERY" ? "text-secondary" : 
                        powerData.source === "GRID" ? "text-chart-4" : "text-accent"
                      )}>
                        {powerData.source}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Priority: </span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {powerData.priority.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last update: {formatTime(powerData.timestamp)}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Zap className="mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Waiting for power data...</p>
                  <p className="mt-1 text-xs text-muted-foreground">Start pzem_read.py on your Raspberry Pi</p>
                </div>
              )}
            </div>
          </div>

          {/* Raw Data Log */}
          <div className="mt-6 border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                MQTT Data Log
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                {dataLog.length} messages
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto p-4">
              {dataLog.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No messages yet - waiting for hardware connection
                </p>
              ) : (
                <div className="space-y-2 font-mono text-xs">
                  {dataLog.slice(0, 20).map((entry) => (
                    <div key={entry.id} className="border-b border-border pb-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-secondary">{entry.topic}</span>
                        <span>@</span>
                        <span>{formatTime(entry.timestamp)}</span>
                      </div>
                      <pre className="mt-1 overflow-x-auto text-foreground">
                        {JSON.stringify(entry.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  status = "ok",
}: {
  label: string
  value: string
  unit: string
  icon: typeof Battery
  status?: "ok" | "warning" | "critical"
}) {
  return (
    <div className={cn(
      "border p-3",
      status === "ok" && "border-border bg-background",
      status === "warning" && "border-chart-4/50 bg-chart-4/10",
      status === "critical" && "border-destructive/50 bg-destructive/10"
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn(
          "h-4 w-4",
          status === "ok" && "text-muted-foreground",
          status === "warning" && "text-chart-4",
          status === "critical" && "text-destructive"
        )} />
        <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-bold text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
