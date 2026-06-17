"use client"

import { Bell, Moon, Sun, User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEnergyStore } from "@/lib/energy-store"
import { useEffect, useState } from "react"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { alerts, kpis } = useEnergyStore()
  const [isDark, setIsDark] = useState(true)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    document.documentElement.classList.add("dark")
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur lg:left-64">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Status Indicators */}
        <div className="hidden items-center gap-6 md:flex">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 ${kpis.isConnected ? "animate-pulse bg-secondary" : "bg-destructive"}`} />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {kpis.isConnected ? "Live Feed" : "Disconnected"}
            </span>
          </div>
          {mounted && kpis.lastUpdate && (
            <div className="text-xs text-muted-foreground">
              <span className="uppercase tracking-wide">Last Update:</span>{" "}
              <span className="font-mono text-secondary">
                {new Date(kpis.lastUpdate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </span>
            </div>
          )}
        </div>

        {/* Time Display */}
        <div className="font-mono text-base lg:text-2xl text-foreground tracking-wider">
          {mounted && currentTime ? (
            <>
              <span className="hidden sm:inline">{currentTime.toLocaleTimeString("en-US", { hour12: false })}</span>
              <span className="sm:hidden">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </span>
              <span className="ml-2 text-xs lg:text-sm text-muted-foreground">
                {currentTime.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">--:--:--</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative hidden sm:flex" onClick={toggleTheme}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {activeAlerts > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center bg-destructive text-[10px] font-bold text-destructive-foreground">
                {activeAlerts}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
