"use client"

import { useEffect, useCallback } from "react"
import useSWR from "swr"
import { useEnergyStore } from "@/lib/energy-store"
import type { HistoricalDataPoint, ThingSpeakACEntry, ThingSpeakDCEntry } from "@/lib/types"

// ThingSpeak Configuration - Two Channels
// AC Channel (3387437): voltage3, voltage4, current3, current4, power3, power4, energy3, energy4
// DC Channel (3387439): bvoltage, svoltage, bcurrent, scurrent, bpower, spower, benergy, senergy
const AC_CHANNEL_ID = process.env.NEXT_PUBLIC_THINGSPEAK_AC_CHANNEL_ID || "3387437"
const AC_READ_API_KEY = process.env.NEXT_PUBLIC_THINGSPEAK_AC_READ_API_KEY || ""
const DC_CHANNEL_ID = process.env.NEXT_PUBLIC_THINGSPEAK_DC_CHANNEL_ID || "3387439"
const DC_READ_API_KEY = process.env.NEXT_PUBLIC_THINGSPEAK_DC_READ_API_KEY || ""

interface ThingSpeakResponse<T> {
  channel: {
    id: number
    name: string
    description: string
    created_at: string
    updated_at: string
    last_entry_id: number
  }
  feeds: T[]
}

const fetcher = async <T>(url: string): Promise<ThingSpeakResponse<T>> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`ThingSpeak API error: ${res.status}`)
  }
  return res.json()
}

function buildApiUrl(channelId: string, apiKey: string, results: number): string {
  return apiKey 
    ? `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=${results}`
    : `https://api.thingspeak.com/channels/${channelId}/feeds.json?results=${results}`
}

function parseACData(feeds: ThingSpeakACEntry[]): Partial<HistoricalDataPoint>[] {
  return feeds.map((entry) => ({
    timestamp: entry.created_at,
    ac1Voltage: parseFloat(entry.field1 ?? "0") || 0,
    ac2Voltage: parseFloat(entry.field2 ?? "0") || 0,
    ac1Current: parseFloat(entry.field3 ?? "0") || 0,
    ac2Current: parseFloat(entry.field4 ?? "0") || 0,
    ac1Power: parseFloat(entry.field5 ?? "0") || 0,
    ac2Power: parseFloat(entry.field6 ?? "0") || 0,
    ac1Energy: parseFloat(entry.field7 ?? "0") || 0,
    ac2Energy: parseFloat(entry.field8 ?? "0") || 0,
  }))
}

function parseDCData(feeds: ThingSpeakDCEntry[]): Partial<HistoricalDataPoint>[] {
  return feeds.map((entry) => ({
    timestamp: entry.created_at,
    dcVoltage: parseFloat(entry.field1 ?? "0") || 0,
    solarVoltage: parseFloat(entry.field2 ?? "0") || 0,
    dcCurrent: parseFloat(entry.field3 ?? "0") || 0,
    solarCurrent: parseFloat(entry.field4 ?? "0") || 0,
    dcPower: parseFloat(entry.field5 ?? "0") || 0,
    solarPower: parseFloat(entry.field6 ?? "0") || 0,
    dcEnergy: parseFloat(entry.field7 ?? "0") || 0,
    solarEnergy: parseFloat(entry.field8 ?? "0") || 0,
  }))
}

function mergeData(
  acData: Partial<HistoricalDataPoint>[],
  dcData: Partial<HistoricalDataPoint>[]
): HistoricalDataPoint[] {
  // Create a map of timestamps to merged data
  const dataMap = new Map<string, HistoricalDataPoint>()

  // Default values
  const defaultPoint: HistoricalDataPoint = {
    timestamp: "",
    dcVoltage: 0, dcCurrent: 0, dcPower: 0, dcEnergy: 0,
    solarVoltage: 0, solarCurrent: 0, solarPower: 0, solarEnergy: 0,
    ac1Voltage: 0, ac1Current: 0, ac1Power: 0, ac1Energy: 0,
    ac2Voltage: 0, ac2Current: 0, ac2Power: 0, ac2Energy: 0,
  }

  // Add AC data
  acData.forEach((ac) => {
    if (ac.timestamp) {
      const existing = dataMap.get(ac.timestamp) || { ...defaultPoint, timestamp: ac.timestamp }
      dataMap.set(ac.timestamp, { ...existing, ...ac })
    }
  })

  // Merge DC data
  dcData.forEach((dc) => {
    if (dc.timestamp) {
      const existing = dataMap.get(dc.timestamp) || { ...defaultPoint, timestamp: dc.timestamp }
      dataMap.set(dc.timestamp, { ...existing, ...dc })
    }
  })

  // Sort by timestamp and return
  return Array.from(dataMap.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

export function useThingSpeak(results: number = 100) {
  const { setHistoricalData, setThingSpeakConnection } = useEnergyStore()

  // Build API URLs for both channels
  const acApiUrl = buildApiUrl(AC_CHANNEL_ID, AC_READ_API_KEY, results)
  const dcApiUrl = buildApiUrl(DC_CHANNEL_ID, DC_READ_API_KEY, results)

  // Fetch AC channel data
  const { data: acData, error: acError, mutate: mutateAC } = useSWR<ThingSpeakResponse<ThingSpeakACEntry>>(
    acApiUrl,
    (url: string) => fetcher<ThingSpeakACEntry>(url),
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      dedupingInterval: 15000,
    }
  )

  // Fetch DC channel data
  const { data: dcData, error: dcError, mutate: mutateDC } = useSWR<ThingSpeakResponse<ThingSpeakDCEntry>>(
    dcApiUrl,
    (url: string) => fetcher<ThingSpeakDCEntry>(url),
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      dedupingInterval: 15000,
    }
  )

  // Update connection status
  useEffect(() => {
    const hasError = acError || dcError
    const hasData = acData || dcData
    
    if (hasError) {
      setThingSpeakConnection(false, (acError?.message || dcError?.message) ?? "Unknown error")
    } else if (hasData) {
      setThingSpeakConnection(true)
    }
  }, [acData, dcData, acError, dcError, setThingSpeakConnection])

  // Process and store merged data
  useEffect(() => {
    const acFeeds = acData?.feeds || []
    const dcFeeds = dcData?.feeds || []
    
    if (acFeeds.length > 0 || dcFeeds.length > 0) {
      const parsedAC = parseACData(acFeeds)
      const parsedDC = parseDCData(dcFeeds)
      const mergedData = mergeData(parsedAC, parsedDC)
      setHistoricalData(mergedData)
    }
  }, [acData, dcData, setHistoricalData])

  const refresh = useCallback(() => {
    mutateAC()
    mutateDC()
  }, [mutateAC, mutateDC])

  const isLoading = !acData && !dcData && !acError && !dcError

  return {
    acChannel: acData?.channel,
    dcChannel: dcData?.channel,
    isLoading,
    error: acError || dcError,
    refresh,
  }
}

// Hook to fetch latest entries from both channels
export function useThingSpeakLatest() {
  const acLatestUrl = AC_READ_API_KEY
    ? `https://api.thingspeak.com/channels/${AC_CHANNEL_ID}/feeds/last.json?api_key=${AC_READ_API_KEY}`
    : `https://api.thingspeak.com/channels/${AC_CHANNEL_ID}/feeds/last.json`
  
  const dcLatestUrl = DC_READ_API_KEY
    ? `https://api.thingspeak.com/channels/${DC_CHANNEL_ID}/feeds/last.json?api_key=${DC_READ_API_KEY}`
    : `https://api.thingspeak.com/channels/${DC_CHANNEL_ID}/feeds/last.json`

  const { data: acLatest } = useSWR<ThingSpeakACEntry>(
    acLatestUrl,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`ThingSpeak error: ${res.status}`)
      return res.json()
    },
    { refreshInterval: 15000, dedupingInterval: 10000 }
  )

  const { data: dcLatest } = useSWR<ThingSpeakDCEntry>(
    dcLatestUrl,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`ThingSpeak error: ${res.status}`)
      return res.json()
    },
    { refreshInterval: 15000, dedupingInterval: 10000 }
  )

  return {
    acLatest: acLatest ? {
      timestamp: acLatest.created_at,
      ac1Voltage: parseFloat(acLatest.field1 ?? "0") || 0,
      ac2Voltage: parseFloat(acLatest.field2 ?? "0") || 0,
      ac1Current: parseFloat(acLatest.field3 ?? "0") || 0,
      ac2Current: parseFloat(acLatest.field4 ?? "0") || 0,
      ac1Power: parseFloat(acLatest.field5 ?? "0") || 0,
      ac2Power: parseFloat(acLatest.field6 ?? "0") || 0,
    } : null,
    dcLatest: dcLatest ? {
      timestamp: dcLatest.created_at,
      dcVoltage: parseFloat(dcLatest.field1 ?? "0") || 0,
      solarVoltage: parseFloat(dcLatest.field2 ?? "0") || 0,
      dcCurrent: parseFloat(dcLatest.field3 ?? "0") || 0,
      solarCurrent: parseFloat(dcLatest.field4 ?? "0") || 0,
      dcPower: parseFloat(dcLatest.field5 ?? "0") || 0,
      solarPower: parseFloat(dcLatest.field6 ?? "0") || 0,
    } : null,
  }
}
