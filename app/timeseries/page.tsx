"use client"

import { useEffect, useMemo, useState } from "react"

import {
  Download,
  RefreshCw,
} from "lucide-react"

import {
  Sidebar,
} from "@/components/layout/sidebar"

import {
  Header,
} from "@/components/layout/header"

import {
  Button,
} from "@/components/ui/button"

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

const CHANNEL_ID = "3381514"

const READ_API_KEY =
  "EDYFCLXDV0XTCEV8"

const timeRanges = [
  {
    label: "1H",
    hours: 1,
    results: 240,
  },

  {
    label: "6H",
    hours: 6,
    results: 1440,
  },

  {
    label: "24H",
    hours: 24,
    results: 4000,
  },

  {
    label: "7D",
    hours: 168,
    results: 8000,
  },

  {
    label: "30D",
    hours: 720,
    results: 8000,
  },
]

interface BatteryPoint {

  time: string

  fullDate: string

  timestamp: number

  voltage: number

  soc: number

  soh: number
}

export default function TimeSeriesPage() {

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(false)

  const [
    selectedRange,
    setSelectedRange,
  ] = useState(24)

  const [
    history,
    setHistory,
  ] = useState<BatteryPoint[]>([])

  const [
    loading,
    setLoading,
  ] = useState(false)

  // Fetch ThingSpeak Data
  const fetchThingSpeakData =
    async () => {

      try {

        setLoading(true)

        const range =
          timeRanges.find(
            (r) =>
              r.hours ===
              selectedRange
          )

        if (!range) return

        let url = ""

        // 1H & 6H
        if (
          selectedRange <= 6
        ) {

          url =
            `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=${range.results}`

        } else {

          // 24H / 7D / 30D
          const days =
            selectedRange / 24

          url =
            `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&days=${days}`
        }

        const response =
          await fetch(url)

        const data =
          await response.json()

        const formatted =
          data.feeds.map(
            (item: any) => {

              const date =
                new Date(
                  item.created_at
                )

              return {

                time:
                  selectedRange >=
                  168
                    ? date.toLocaleDateString()
                    : date.toLocaleTimeString(),

                fullDate:
                  date.toLocaleString(),

                timestamp:
                  date.getTime(),

                voltage: Number(
                  item.field1 || 0
                ),

                soc: Number(
                  item.field4 || 0
                ),

                soh: Number(
                  item.field5 || 0
                ),
              }
            }
          )

        setHistory(formatted)

      } catch (err) {

        console.log(
          "ThingSpeak Fetch Error:",
          err
        )

      } finally {

        setLoading(false)
      }
    }

  // Auto Fetch
  useEffect(() => {

    fetchThingSpeakData()

  }, [selectedRange])

  // Auto Refresh Every 15s
  useEffect(() => {

    const interval =
      setInterval(
        fetchThingSpeakData,
        15000
      )

    return () =>
      clearInterval(interval)

  }, [selectedRange])

  // Downsampling
  const filteredHistory =
    useMemo(() => {

      let filtered = history

      if (
        selectedRange >= 720
      ) {

        filtered =
          filtered.filter(
            (_, index) =>
              index % 20 === 0
          )

      } else if (
        selectedRange >= 168
      ) {

        filtered =
          filtered.filter(
            (_, index) =>
              index % 8 === 0
          )

      } else if (
        selectedRange >= 24
      ) {

        filtered =
          filtered.filter(
            (_, index) =>
              index % 3 === 0
          )
      }

      return filtered

    }, [history, selectedRange])

  // CSV Export
  const exportCSV = () => {

    if (
      filteredHistory.length === 0
    ) {
      alert(
        "No data available"
      )
      return
    }

    const headers =
      "Date Time,Voltage,SOC,SOH\n"

    const rows =
      filteredHistory
        .map(
          (item) =>
            `${item.fullDate},${item.voltage},${item.soc},${item.soh}`
        )
        .join("\n")

    const csvContent =
      headers + rows

    const blob = new Blob(
      [csvContent],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    )

    const url =
      window.URL.createObjectURL(
        blob
      )

    const link =
      document.createElement(
        "a"
      )

    link.href = url

    link.download =
      `battery-history-${selectedRange}h.csv`

    link.click()

    window.URL.revokeObjectURL(
      url
    )
  }

  return (
    <div className="min-h-screen bg-background">

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() =>
          setIsSidebarOpen(false)
        }
      />

      <Header
        onMenuClick={() =>
          setIsSidebarOpen(true)
        }
      />

      <main className="pt-16 lg:ml-64">

        <div className="p-4 md:p-6">

          {/* Header */}
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h1 className="text-xl font-bold uppercase tracking-wider text-foreground md:text-2xl">
                Time Series Analysis
              </h1>

              <p className="text-xs text-muted-foreground md:text-sm">
                Historical Battery Analytics
              </p>

            </div>

            <div className="flex gap-2">

              <Button
                variant="outline"
                size="sm"
                onClick={
                  fetchThingSpeakData
                }
              >
                <RefreshCw className="mr-2 h-4 w-4" />

                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
              >
                <Download className="mr-2 h-4 w-4" />

                Export CSV
              </Button>

            </div>
          </div>

          {/* Controls */}
          <div className="mb-6 border border-border bg-card p-4">

            <p className="mb-2 text-[10px] uppercase text-muted-foreground">
              Time Range
            </p>

            <div className="flex flex-wrap gap-2">

              {timeRanges.map(
                (range) => (

                  <Button
                    key={
                      range.hours
                    }

                    size="sm"

                    variant={
                      selectedRange ===
                      range.hours
                        ? "default"
                        : "outline"
                    }

                    onClick={() =>
                      setSelectedRange(
                        range.hours
                      )
                    }
                  >
                    {range.label}
                  </Button>
                )
              )}

            </div>
          </div>

          {/* VOLTAGE GRAPH */}
          <div className="mb-6 border border-border bg-card p-4 md:p-6">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Voltage Trend
                </h3>

                <p className="text-xs text-muted-foreground">
                  Battery Voltage Analytics
                </p>

              </div>

              <span className="text-sm font-bold text-blue-500">
                Voltage (V)
              </span>

            </div>

            <div className="h-[350px] w-full">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={
                    filteredHistory
                  }
                >

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="time"
                    minTickGap={40}
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <YAxis />

                  <Tooltip
                    labelFormatter={(
                      value,
                      payload
                    ) =>
                      payload?.[0]
                        ?.payload
                        ?.fullDate
                    }
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="voltage"
                    name="Voltage (V)"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={false}
                  />

                </LineChart>

              </ResponsiveContainer>
            </div>
          </div>

          {/* SOC GRAPH */}
          <div className="mb-6 border border-border bg-card p-4 md:p-6">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  State Of Charge
                </h3>

                <p className="text-xs text-muted-foreground">
                  Battery Charge Monitoring
                </p>

              </div>

              <span className="text-sm font-bold text-green-500">
                SOC (%)
              </span>

            </div>

            <div className="h-[350px] w-full">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={
                    filteredHistory
                  }
                >

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="time"
                    minTickGap={40}
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <YAxis domain={[0, 100]} />

                  <Tooltip
                    labelFormatter={(
                      value,
                      payload
                    ) =>
                      payload?.[0]
                        ?.payload
                        ?.fullDate
                    }
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="soc"
                    name="SOC (%)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                  />

                </LineChart>

              </ResponsiveContainer>
            </div>
          </div>

          {/* SOH GRAPH */}
          <div className="border border-border bg-card p-4 md:p-6">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  State Of Health
                </h3>

                <p className="text-xs text-muted-foreground">
                  Battery Health Monitoring
                </p>

              </div>

              <span className="text-sm font-bold text-yellow-500">
                SOH (%)
              </span>

            </div>

            <div className="h-[350px] w-full">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={
                    filteredHistory
                  }
                >

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="time"
                    minTickGap={40}
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <YAxis domain={[0, 100]} />

                  <Tooltip
                    labelFormatter={(
                      value,
                      payload
                    ) =>
                      payload?.[0]
                        ?.payload
                        ?.fullDate
                    }
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="soh"
                    name="SOH (%)"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={false}
                  />

                </LineChart>

              </ResponsiveContainer>
            </div>

            {/* Footer */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">

              <span>
                Total Points:

                <span className="ml-1 font-bold text-foreground">
                  {
                    filteredHistory.length
                  }
                </span>
              </span>

              <span>
                Range:

                <span className="ml-1 font-bold text-foreground">

                  {
                    timeRanges.find(
                      (r) =>
                        r.hours ===
                        selectedRange
                    )?.label
                  }

                </span>
              </span>

              <span>
                Status:

                <span className="ml-1 font-bold text-secondary">
                  {
                    loading
                      ? "Loading..."
                      : "Live"
                  }
                </span>
              </span>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}