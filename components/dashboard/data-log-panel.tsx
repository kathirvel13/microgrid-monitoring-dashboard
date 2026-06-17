"use client"

import { useEffect, useState } from "react"
import { Database, Wifi, Clock } from "lucide-react"
import { useEnergyStore } from "@/lib/energy-store"
import { cn } from "@/lib/utils"

export function DataLogPanel() {
  const { dataLog } = useEnergyStore()
  const recentLogs = dataLog.slice(0, 10)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  const formatData = (data: unknown) => {
    if (typeof data === "object" && data !== null) {
      const obj = data as Record<string, unknown>
      // Show key metrics based on data type
      if ("soc" in obj) {
        return `SOC: ${obj.soc}% | V: ${(obj.voltage as number)?.toFixed(1)}V | I: ${(obj.current as number)?.toFixed(2)}A`
      }
      if ("ac1_power" in obj) {
        return `AC1: ${(obj.ac1_power as number)?.toFixed(0)}W | AC2: ${(obj.ac2_power as number)?.toFixed(0)}W | ${obj.source}`
      }
    }
    return JSON.stringify(data).slice(0, 50)
  }

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Data Log</h3>
        <span className="font-mono text-xs text-muted-foreground">{dataLog.length} entries</span>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {recentLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Database className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No data received</p>
            <p className="text-xs text-muted-foreground">Waiting for MQTT messages...</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentLogs.map((entry) => (
              <div key={entry.id} className="p-2 hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  {entry.source === "mqtt" ? (
                    <Wifi className="h-3 w-3 text-secondary" />
                  ) : (
                    <Database className="h-3 w-3 text-accent" />
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {entry.topic || entry.source}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {mounted ? formatTime(entry.timestamp) : "--:--:--"}
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-xs text-foreground">
                  {formatData(entry.data)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
