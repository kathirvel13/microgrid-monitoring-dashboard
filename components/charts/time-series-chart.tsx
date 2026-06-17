"use client"

import { useEnergyStore } from "@/lib/energy-store"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

interface TimeSeriesChartProps {
  showBattery?: boolean
  dataKey?: "dcPower" | "acPower" | "voltage" | "energy"
}

export function TimeSeriesChart({ showBattery = false, dataKey = "dcPower" }: TimeSeriesChartProps) {
  const { historicalData, connection } = useEnergyStore()

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  }

  if (historicalData.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No historical data available</p>
          <p className="mt-1 text-xs">
            {connection.thingspeak 
              ? "Waiting for data from ThingSpeak..." 
              : "Connect to ThingSpeak to view historical data"}
          </p>
        </div>
      </div>
    )
  }

  // Battery/DC Power chart
  if (showBattery || dataKey === "dcPower") {
    return (
      <ResponsiveContainer width="100%" height={350} className="md:h-[400px]">
        <LineChart data={historicalData} margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} unit=" W" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 0,
              fontSize: "12px",
            }}
            labelFormatter={formatTime}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Line type="monotone" dataKey="dcPower" stroke="#10b981" strokeWidth={2.5} dot={false} name="Battery Power (W)" />
          <Line type="monotone" dataKey="solarPower" stroke="#f59e0b" strokeWidth={2} dot={false} name="Solar Power (W)" />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // AC Power chart
  if (dataKey === "acPower") {
    return (
      <ResponsiveContainer width="100%" height={350} className="md:h-[400px]">
        <LineChart data={historicalData} margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} unit=" W" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 0,
              fontSize: "12px",
            }}
            labelFormatter={formatTime}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Line type="monotone" dataKey="ac1Power" stroke="#06b6d4" strokeWidth={2.5} dot={false} name="AC1 Power (W)" />
          <Line type="monotone" dataKey="ac2Power" stroke="#a855f7" strokeWidth={2} dot={false} name="AC2 Power (W)" />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // Voltage chart
  if (dataKey === "voltage") {
    return (
      <ResponsiveContainer width="100%" height={350} className="md:h-[400px]">
        <LineChart data={historicalData} margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} unit=" V" domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 0,
              fontSize: "12px",
            }}
            labelFormatter={formatTime}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Line type="monotone" dataKey="dcVoltage" stroke="#10b981" strokeWidth={2.5} dot={false} name="DC Voltage (V)" />
          <Line type="monotone" dataKey="ac1Voltage" stroke="#06b6d4" strokeWidth={2} dot={false} name="AC1 Voltage (V)" />
          <Line type="monotone" dataKey="ac2Voltage" stroke="#a855f7" strokeWidth={2} dot={false} name="AC2 Voltage (V)" />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // Energy chart
  if (dataKey === "energy") {
    return (
      <ResponsiveContainer width="100%" height={350} className="md:h-[400px]">
        <AreaChart data={historicalData} margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} unit=" Wh" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 0,
              fontSize: "12px",
            }}
            labelFormatter={formatTime}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Area type="monotone" dataKey="dcEnergy" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} name="DC Energy (Wh)" />
          <Area type="monotone" dataKey="ac1Energy" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} name="AC1 Energy (Wh)" />
          <Area type="monotone" dataKey="ac2Energy" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} strokeWidth={2} name="AC2 Energy (Wh)" />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  // Default fallback
  return (
    <ResponsiveContainer width="100%" height={350} className="md:h-[400px]">
      <LineChart data={historicalData} margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTime}
          stroke="hsl(var(--muted-foreground))"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} unit=" W" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 0,
            fontSize: "12px",
          }}
          labelFormatter={formatTime}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Line type="monotone" dataKey="dcPower" stroke="#10b981" strokeWidth={2.5} dot={false} name="DC Power (W)" />
      </LineChart>
    </ResponsiveContainer>
  )
}
