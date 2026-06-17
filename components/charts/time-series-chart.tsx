"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface TimeSeriesChartProps {
  historyData: any[]
}

export function TimeSeriesChart({
  historyData,
}: TimeSeriesChartProps) {

  return (

    <div className="h-[350px] w-full">

      <ResponsiveContainer
        width="100%"
        height="100%"
      >

        <LineChart data={historyData}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
          />

          <YAxis />

          <Tooltip />

          <Legend />

          {/* Voltage */}
          <Line
            type="monotone"
            dataKey="voltage"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Voltage"
          />

          {/* SOC */}
          <Line
            type="monotone"
            dataKey="soc"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="SOC"
          />

          {/* SOH */}
          <Line
            type="monotone"
            dataKey="soh"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            name="SOH"
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  )
}