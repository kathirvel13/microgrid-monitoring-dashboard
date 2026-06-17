"use client"

import { useEffect, useRef, useState } from "react"
import { WifiOff } from "lucide-react"
import type { EnergyFlow } from "@/lib/types"

interface EnergySankeyProps {
  flow: EnergyFlow
  isOffline?: boolean
}

export function EnergySankey({ flow, isOffline = false }: EnergySankeyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 320 })

  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        setDimensions({ width, height: 320 })
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dimensions.width === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = dimensions.width
    const h = dimensions.height

    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, w, h)

    const isMobile = w < 640
    const nodeRadius = isMobile ? 35 : 45
    const fontSize = isMobile ? 10 : 13
    const valueFontSize = isMobile ? 12 : 15
    const flowLabelSize = isMobile ? 10 : 12

    // Updated nodes for hardware setup: Battery -> AC1/AC2 or Grid -> AC1/AC2
    // Values in Watts for better readability with small power values
    const nodes = {
      battery: {
        x: Math.max(80, w * 0.15),
        y: h / 2 - 40,
        label: "DC Battery",
        shortLabel: "Battery",
        value: flow.totalGeneration, // Watts
        color: "#10b981",
      },
      grid: {
        x: Math.max(80, w * 0.15),
        y: h / 2 + 60,
        label: "Grid (AC1)",
        shortLabel: "Grid",
        value: flow.gridToAC1 + flow.gridToAC2,
        color: "#a855f7",
      },
      ac1: {
        x: Math.min(w - 80, w * 0.85),
        y: h / 2 - 40,
        label: "PZEM-1",
        shortLabel: "AC1",
        value: flow.batteryToAC1 + flow.gridToAC1,
        color: "#06b6d4",
      },
      ac2: {
        x: Math.min(w - 80, w * 0.85),
        y: h / 2 + 60,
        label: "PZEM-2",
        shortLabel: "AC2",
        value: flow.batteryToAC2 + flow.gridToAC2,
        color: "#f59e0b",
      },
    }

    // Draw curved flow paths (values in Watts)
    const drawFlow = (from: keyof typeof nodes, to: keyof typeof nodes, value: number, color: string) => {
      if (value <= 0.1) return // Skip very small flows

      const n1 = nodes[from]
      const n2 = nodes[to]

      const maxThickness = isMobile ? 18 : 25
      const minThickness = isMobile ? 3 : 5
      // Scale thickness for Watts (max around 100W for this small system)
      const thickness = Math.max(minThickness, Math.min(maxThickness, value / 5))

      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = thickness
      ctx.globalAlpha = 0.7
      ctx.lineCap = "round"

      const dx = n2.x - n1.x
      const dy = n2.y - n1.y

      // Simple curve
      const cpX = (n1.x + n2.x) / 2
      const cpY = (n1.y + n2.y) / 2 - 20

      ctx.moveTo(n1.x + nodeRadius, n1.y)
      ctx.quadraticCurveTo(cpX, cpY, n2.x - nodeRadius, n2.y)
      ctx.stroke()
      ctx.globalAlpha = 1

      // Flow label (in Watts)
      const midX = cpX
      const midY = cpY - 10
      ctx.fillStyle = color
      ctx.font = `bold ${flowLabelSize}px 'Source Code Pro', monospace`
      ctx.textAlign = "center"
      ctx.fillText(`${value.toFixed(1)} W`, midX, midY)
    }

    // Draw circular nodes
    Object.entries(nodes).forEach(([, node]) => {
      // Outer glow
      ctx.globalAlpha = 0.3
      ctx.fillStyle = node.color
      ctx.beginPath()
      ctx.arc(node.x, node.y, nodeRadius + 5, 0, Math.PI * 2)
      ctx.fill()

      // Main circle
      ctx.globalAlpha = 1
      ctx.fillStyle = node.color
      ctx.beginPath()
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2)
      ctx.fill()

      // Inner darker circle
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
      ctx.beginPath()
      ctx.arc(node.x, node.y, nodeRadius - 3, 0, Math.PI * 2)
      ctx.fill()

      const displayLabel = isMobile ? node.shortLabel : node.label
      ctx.fillStyle = "#ffffff"
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.textAlign = "center"
      ctx.fillText(displayLabel, node.x, node.y - 5)

      // Value text (in Watts)
      ctx.font = `bold ${valueFontSize}px 'Source Code Pro', monospace`
      ctx.fillText(`${node.value.toFixed(1)} W`, node.x, node.y + (isMobile ? 8 : 12))
    })

    // Draw all flows (values in Watts)
    drawFlow("battery", "ac1", flow.batteryToAC1, "#10b981")
    drawFlow("battery", "ac2", flow.batteryToAC2, "#10b981")
    drawFlow("grid", "ac1", flow.gridToAC1, "#a855f7")
    drawFlow("grid", "ac2", flow.gridToAC2, "#a855f7")
  }, [flow, dimensions])

  return (
    <div className="border border-border bg-card p-3 md:p-4">
      <div className="mb-3 flex items-center justify-between md:mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Energy Flow</h3>
        {isOffline ? (
          <div className="flex items-center gap-2 rounded border border-muted/50 px-2 py-1 md:px-3">
            <WifiOff className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Offline</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded border border-secondary/50 px-2 py-1 md:px-3">
            <div className="h-2 w-2 animate-pulse bg-secondary" />
            <span className="text-xs font-medium text-secondary">Live</span>
          </div>
        )}
      </div>
      <div ref={containerRef} className="w-full">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ width: "100%", height: `${dimensions.height}px`, display: "block" }}
        />
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs md:mt-4 md:gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#10b981" }} />
          <span className="text-muted-foreground">Battery</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#a855f7" }} />
          <span className="text-muted-foreground">Grid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#06b6d4" }} />
          <span className="text-muted-foreground">PZEM-1 (AC1)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
          <span className="text-muted-foreground">PZEM-2 (AC2)</span>
        </div>
      </div>

      {/* Summary - in Watts */}
      <div className="mt-3 flex justify-center gap-6 border-t border-border pt-3 text-xs">
        <div className="text-center">
          <p className="text-muted-foreground">DC Power</p>
          <p className={`font-mono text-lg font-bold ${isOffline ? "text-muted-foreground" : "text-secondary"}`}>
            {isOffline ? "-" : `${flow.totalGeneration.toFixed(1)} W`}
          </p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">AC Consumption</p>
          <p className={`font-mono text-lg font-bold ${isOffline ? "text-muted-foreground" : "text-chart-4"}`}>
            {isOffline ? "-" : `${flow.totalConsumption.toFixed(1)} W`}
          </p>
        </div>
      </div>
    </div>
  )
}
