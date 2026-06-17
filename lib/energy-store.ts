"use client"

import { create } from "zustand"
import type { NodeMetadata, Telemetry, Alert, OptimizerDecision, KPIs, EnergyFlow } from "./types"
import {
  mockNodes,
  mockAlerts,
  mockOptimizerDecisions,
  generateTelemetry,
  generateKPIs,
  generateEnergyFlow,
} from "./mock-data"

interface EnergyStore {
  nodes: NodeMetadata[]
  telemetry: Record<string, Telemetry>
  alerts: Alert[]
  optimizerDecisions: OptimizerDecision[]
  kpis: KPIs
  energyFlow: EnergyFlow
  selectedNodeId: string | null
  isConnected: boolean

  setSelectedNode: (nodeId: string | null) => void
  acknowledgeAlert: (alertId: string) => void
  updateOptimizerDecision: (id: string, status: "accepted" | "rejected") => void
  updateTelemetry: (nodeId: string, data: Telemetry) => void
  refreshData: () => void
}

export const useEnergyStore = create<EnergyStore>((set, get) => ({
  nodes: mockNodes,
  telemetry: {},
  alerts: mockAlerts,
  optimizerDecisions: mockOptimizerDecisions,
  kpis: generateKPIs(),
  energyFlow: generateEnergyFlow(),
  selectedNodeId: null,
  isConnected: true,

  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)),
    })),

  updateOptimizerDecision: (id, status) =>
    set((state) => ({
      optimizerDecisions: state.optimizerDecisions.map((d) => (d.id === id ? { ...d, status } : d)),
    })),

  updateTelemetry: (nodeId, data) =>
    set((state) => ({
      telemetry: { ...state.telemetry, [nodeId]: data },
    })),

  refreshData: () => {
    const { nodes } = get()
    const newTelemetry: Record<string, Telemetry> = {}

    nodes.forEach((node) => {
      if (node.status !== "offline") {
        newTelemetry[node.nodeId] = generateTelemetry(node)
      }
    })

    set({
      telemetry: newTelemetry,
      kpis: generateKPIs(),
      energyFlow: generateEnergyFlow(),
    })
  },
}))
