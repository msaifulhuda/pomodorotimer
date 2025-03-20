"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartPie,
  ChartPieSeries,
  ChartPieValueLabel,
} from "@/components/ui/chart"

interface PomodoroStatsProps {
  stats: {
    totalWorkTime: number
    completedSessions: number
    completedBreaks: number
    completedLongBreaks: number
    dailyStats: Record<
      string,
      {
        workSessions: number
        shortBreaks: number
        longBreaks: number
        totalWorkTime: number
      }
    >
  }
}

export default function PomodoroStats({ stats }: PomodoroStatsProps) {
  // Format time as hours and minutes
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }

    return `${minutes}m`
  }

  // Get today's date
  const today = new Date().toISOString().split("T")[0]

  // Get today's stats
  const todayStats = stats.dailyStats[today] || {
    workSessions: 0,
    shortBreaks: 0,
    longBreaks: 0,
    totalWorkTime: 0,
  }

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const now = new Date()
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    let totalWorkTime = 0
    let workSessions = 0
    let shortBreaks = 0
    let longBreaks = 0

    Object.entries(stats.dailyStats).forEach(([date, dayStat]) => {
      const statDate = new Date(date)
      if (statDate >= oneWeekAgo && statDate <= now) {
        totalWorkTime += dayStat.totalWorkTime
        workSessions += dayStat.workSessions
        shortBreaks += dayStat.shortBreaks
        longBreaks += dayStat.longBreaks
      }
    })

    return {
      totalWorkTime,
      workSessions,
      shortBreaks,
      longBreaks,
    }
  }, [stats.dailyStats])

  // Prepare chart data
  const chartData = [
    { name: "Work", value: todayStats.workSessions },
    { name: "Short Breaks", value: todayStats.shortBreaks },
    { name: "Long Breaks", value: todayStats.longBreaks },
  ]

  // Export stats as CSV
  const exportStats = () => {
    const headers = ["Date", "Work Sessions", "Short Breaks", "Long Breaks", "Total Work Time (minutes)"]
    const rows = Object.entries(stats.dailyStats).map(([date, stat]) => [
      date,
      stat.workSessions,
      stat.shortBreaks,
      stat.longBreaks,
      Math.round(stat.totalWorkTime / 60),
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `pomodoro-stats-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Statistics</h2>
        <Button variant="outline" size="sm" onClick={exportStats}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Today</h3>
            <div className="text-2xl font-bold">{formatTime(todayStats.totalWorkTime)}</div>
            <div className="text-sm text-muted-foreground">Focus time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">This Week</h3>
            <div className="text-2xl font-bold">{formatTime(weeklyStats.totalWorkTime)}</div>
            <div className="text-sm text-muted-foreground">Focus time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Sessions Today</h3>
            <div className="text-2xl font-bold">{todayStats.workSessions}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Sessions</h3>
            <div className="text-2xl font-bold">{stats.completedSessions}</div>
            <div className="text-sm text-muted-foreground">All time</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Today's Session Breakdown</h3>
          <div className="h-[200px]">
            <ChartContainer>
              <Chart>
                <ChartPie>
                  <ChartPieSeries
                    data={chartData}
                    category="name"
                    value="value"
                    colorScale={["#ef4444", "#22c55e", "#3b82f6"]}
                  >
                    <ChartPieValueLabel />
                  </ChartPieSeries>
                </ChartPie>
                <ChartTooltip />
                <ChartLegend />
              </Chart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {todayStats.workSessions >= 10 && (
        <div className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 p-4 rounded-lg flex items-center justify-center">
          <span className="text-2xl mr-2">🔥</span>
          <span className="font-medium">Awesome! You've completed 10 sessions today!</span>
        </div>
      )}
    </div>
  )
}

