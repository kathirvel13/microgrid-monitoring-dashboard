"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from "lucide-react"
import { useEnergyStore } from "@/lib/energy-store"
import { cn } from "@/lib/utils"

export function ConnectionStatus() {
  const { connection } = useEnergyStore()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "Never"
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit", 
      second: "2-digit",
      hour12: false 
    })
  }

  return (
    <div className="flex items-center gap-3">
      {/* MQTT Status */}
      <div className="flex items-center gap-1.5" title={connection.mqttError ?? "MQTT connection status"}>
        {connection.mqtt ? (
          <Wifi className="h-3.5 w-3.5 text-secondary" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className={cn(
          "text-xs font-medium",
          connection.mqtt ? "text-secondary" : "text-muted-foreground"
        )}>
          MQTT
        </span>
        <div className={cn(
          "h-1.5 w-1.5 rounded-full",
          connection.mqtt ? "bg-secondary animate-pulse" : "bg-muted-foreground"
        )} />
      </div>

      {/* ThingSpeak Status */}
      <div className="flex items-center gap-1.5" title={connection.thingspeakError ?? "ThingSpeak connection status"}>
        {connection.thingspeak ? (
          <Cloud className="h-3.5 w-3.5 text-chart-1" />
        ) : (
          <CloudOff className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className={cn(
          "hidden text-xs font-medium sm:inline",
          connection.thingspeak ? "text-chart-1" : "text-muted-foreground"
        )}>
          TS
        </span>
        <div className={cn(
          "h-1.5 w-1.5 rounded-full",
          connection.thingspeak ? "bg-chart-1" : "bg-muted-foreground"
        )} />
      </div>

      {/* Last Update */}
      {mounted && connection.lastMqttMessage && (
        <div className="hidden items-center gap-1 text-[10px] text-muted-foreground lg:flex">
          <RefreshCw className="h-3 w-3" />
          <span>{formatTime(connection.lastMqttMessage)}</span>
        </div>
      )}
    </div>
  )
}
