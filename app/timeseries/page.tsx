"use client"

import { useState, useEffect } from "react"
import { Download, RefreshCw, WifiOff, Cloud } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { TimeSeriesChart } from "@/components/charts/time-series-chart"
import { useEnergyStore } from "@/lib/energy-store"
import { useThingSpeak } from "@/hooks/use-thingspeak"

export default function TimeSeriesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { historicalData, connection } = useEnergyStore()
  
  // Fetch from ThingSpeak (both AC and DC channels)
  const { isLoading, refresh, acChannel, dcChannel } = useThingSpeak(100)

  useEffect(() => {
    setMounted(true)
  }, [])

  const exportCSV = () => {
    if (historicalData.length === 0) return

    const headers = ["Timestamp", "DC Voltage", "DC Current", "DC Power", "DC Energy", "AC1 Voltage", "AC1 Current", "AC1 Power", "AC1 Energy", "AC2 Voltage", "AC2 Current", "AC2 Power", "AC2 Energy"]
    const rows = historicalData.map((d) => [
      d.timestamp,
      d.dcVoltage,
      d.dcCurrent,
      d.dcPower,
      d.dcEnergy,
      d.ac1Voltage,
      d.ac1Current,
      d.ac1Power,
      d.ac1Energy,
      d.ac2Voltage,
      d.ac2Current,
      d.ac2Power,
      d.ac2Energy,
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `energy-data-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="pt-16 lg:ml-64">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="mb-4 flex flex-col gap-4 md:mb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider text-foreground md:text-2xl">
                Historical Data
              </h1>
              <p className="text-xs text-muted-foreground md:text-sm">
                {connection.thingspeak ? (
                  <span className="flex items-center gap-1 text-secondary">
                    <Cloud className="h-3 w-3" />
                    Data from ThingSpeak (AC: #{acChannel?.id ?? "3387437"}, DC: #{dcChannel?.id ?? "3387439"})
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <WifiOff className="h-3 w-3" />
                    ThingSpeak not connected
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${connection.thingspeak ? "animate-pulse bg-secondary" : "bg-muted-foreground"}`} />
              <span className="text-sm text-muted-foreground">
                {connection.thingspeak ? "ThingSpeak Connected" : "ThingSpeak Offline"}
              </span>
            </div>
          </div>

          {/* No Data Warning */}
          {!connection.thingspeak && historicalData.length === 0 && (
            <div className="mb-6 flex items-center gap-3 border border-muted/50 bg-muted/10 px-4 py-3">
              <WifiOff className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">No Historical Data Available</p>
                <p className="text-xs text-muted-foreground">
                  ThingSpeak data will appear here once your hardware starts sending data.
                </p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="mb-4 border border-border bg-card p-4 md:mb-6">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Data Controls
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => refresh()} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>
              <Button variant="outline" onClick={exportCSV} disabled={historicalData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">
                {historicalData.length} data points loaded
              </span>
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-4 md:space-y-6">
            {/* DC Power Chart */}
            <div className="border border-border bg-card p-4 md:p-6">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-6 md:text-sm">
                DC / Battery Power
              </h3>
              <TimeSeriesChart dataKey="dcPower" />
            </div>

            {/* AC Power Chart */}
            <div className="border border-border bg-card p-4 md:p-6">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-6 md:text-sm">
                AC Load Power (AC1 & AC2)
              </h3>
              <TimeSeriesChart dataKey="acPower" />
            </div>

            {/* Voltage Chart */}
            <div className="border border-border bg-card p-4 md:p-6">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-6 md:text-sm">
                Voltage Readings
              </h3>
              <TimeSeriesChart dataKey="voltage" />
            </div>

            {/* Energy Chart */}
            <div className="border border-border bg-card p-4 md:p-6">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-6 md:text-sm">
                Cumulative Energy
              </h3>
              <TimeSeriesChart dataKey="energy" />
            </div>
          </div>

          {/* Raw Data Table */}
          {mounted && historicalData.length > 0 && (
            <div className="mt-6 border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Raw Data (Last 20 entries)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">Time</th>
                      <th className="px-3 py-2 text-right font-medium">DC V</th>
                      <th className="px-3 py-2 text-right font-medium">DC I</th>
                      <th className="px-3 py-2 text-right font-medium">DC P</th>
                      <th className="px-3 py-2 text-right font-medium">AC1 V</th>
                      <th className="px-3 py-2 text-right font-medium">AC1 P</th>
                      <th className="px-3 py-2 text-right font-medium">AC2 V</th>
                      <th className="px-3 py-2 text-right font-medium">AC2 P</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalData.slice(-20).reverse().map((row, i) => (
                      <tr key={i} className="border-b border-border hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono">
                          {new Date(row.timestamp).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{row.dcVoltage.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono">{row.dcCurrent.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono">{row.dcPower.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right font-mono">{row.ac1Voltage.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right font-mono">{row.ac1Power.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right font-mono">{row.ac2Voltage.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right font-mono">{row.ac2Power.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
