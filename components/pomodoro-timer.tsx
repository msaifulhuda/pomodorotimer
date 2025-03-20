"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, SkipForward, RefreshCw, Settings } from "lucide-react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import TaskList from "@/components/task-list"
import PomodoroSettings from "@/components/pomodoro-settings"
import PomodoroStats from "@/components/pomodoro-stats"
import { cn } from "@/lib/utils"

// Timer modes
const TIMER_MODES = {
  WORK: "work",
  SHORT_BREAK: "shortBreak",
  LONG_BREAK: "longBreak",
}

// Default timer settings
const DEFAULT_SETTINGS = {
  work: 25 * 60, // 25 minutes in seconds
  shortBreak: 5 * 60, // 5 minutes in seconds
  longBreak: 15 * 60, // 15 minutes in seconds
  sessionsBeforeLongBreak: 4,
  autoStartNextSession: false,
  enableNotifications: true,
  enableSounds: true,
}

export default function PomodoroTimer() {
  // Settings state
  const [settings, setSettings] = useLocalStorage("pomodoroSettings", DEFAULT_SETTINGS)

  // Timer state
  const [mode, setMode] = useState(TIMER_MODES.WORK)
  const [timeLeft, setTimeLeft] = useState(settings.work)
  const [isActive, setIsActive] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  // Stats state
  const [stats, setStats] = useLocalStorage("pomodoroStats", {
    totalWorkTime: 0,
    completedSessions: 0,
    completedBreaks: 0,
    completedLongBreaks: 0,
    dailyStats: {},
  })

  // Get current date for stats
  const today = new Date().toISOString().split("T")[0]

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    const totalTime =
      mode === TIMER_MODES.WORK
        ? settings.work
        : mode === TIMER_MODES.SHORT_BREAK
          ? settings.shortBreak
          : settings.longBreak

    return 100 - (timeLeft / totalTime) * 100
  }, [timeLeft, mode, settings])

  // Get background color based on current mode
  const getBgColor = useCallback(() => {
    switch (mode) {
      case TIMER_MODES.WORK:
        return "bg-red-500 dark:bg-red-700"
      case TIMER_MODES.SHORT_BREAK:
        return "bg-green-500 dark:bg-green-700"
      case TIMER_MODES.LONG_BREAK:
        return "bg-blue-500 dark:bg-blue-700"
      default:
        return "bg-red-500 dark:bg-red-700"
    }
  }, [mode])

  // Get text color based on current mode
  const getTextColor = useCallback(() => {
    switch (mode) {
      case TIMER_MODES.WORK:
        return "text-red-500 dark:text-red-400"
      case TIMER_MODES.SHORT_BREAK:
        return "text-green-500 dark:text-green-400"
      case TIMER_MODES.LONG_BREAK:
        return "text-blue-500 dark:text-blue-400"
      default:
        return "text-red-500 dark:text-red-400"
    }
  }, [mode])

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    const audio = new Audio("/notification.mp3")

    if (settings.enableSounds) {
      audio.play().catch((error) => console.error("Error playing sound:", error))
    }

    if (settings.enableNotifications) {
      if (Notification.permission === "granted") {
        const title = mode === TIMER_MODES.WORK ? "Work session completed!" : "Break time over!"

        new Notification(title, {
          body: mode === TIMER_MODES.WORK ? "Time for a break!" : "Ready to focus again?",
          icon: "/favicon.ico",
        })
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission()
      }
    }

    // Update stats
    setStats((prevStats) => {
      const newStats = { ...prevStats }

      if (mode === TIMER_MODES.WORK) {
        newStats.completedSessions += 1
        newStats.totalWorkTime += settings.work

        // Update daily stats
        if (!newStats.dailyStats[today]) {
          newStats.dailyStats[today] = {
            workSessions: 0,
            shortBreaks: 0,
            longBreaks: 0,
            totalWorkTime: 0,
          }
        }

        newStats.dailyStats[today].workSessions += 1
        newStats.dailyStats[today].totalWorkTime += settings.work
      } else if (mode === TIMER_MODES.SHORT_BREAK) {
        newStats.completedBreaks += 1

        if (newStats.dailyStats[today]) {
          newStats.dailyStats[today].shortBreaks += 1
        }
      } else {
        newStats.completedLongBreaks += 1

        if (newStats.dailyStats[today]) {
          newStats.dailyStats[today].longBreaks += 1
        }
      }

      return newStats
    })

    // Determine next mode and update state
    if (mode === TIMER_MODES.WORK) {
      // After work session, check if we need a long break
      setCompletedSessions((prev) => {
        const newCompletedSessions = prev + 1
        if (newCompletedSessions >= settings.sessionsBeforeLongBreak) {
          setMode(TIMER_MODES.LONG_BREAK)
          setTimeLeft(settings.longBreak)
          return 0
        } else {
          setMode(TIMER_MODES.SHORT_BREAK)
          setTimeLeft(settings.shortBreak)
          return newCompletedSessions
        }
      })
    } else {
      // After any break, go back to work
      setMode(TIMER_MODES.WORK)
      setTimeLeft(settings.work)
    }

    // Auto-start next session if enabled
    setIsActive(settings.autoStartNextSession)
  }, [mode, settings, today, setStats])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (isActive && timeLeft === 0) {
      setIsActive(false) // Stop the timer first
      handleTimerComplete()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft, handleTimerComplete])

  // Reset timer when settings change
  useEffect(() => {
    // Only update timeLeft if the timer is not active
    if (!isActive) {
      if (mode === TIMER_MODES.WORK) {
        setTimeLeft(settings.work)
      } else if (mode === TIMER_MODES.SHORT_BREAK) {
        setTimeLeft(settings.shortBreak)
      } else {
        setTimeLeft(settings.longBreak)
      }
    }
  }, [settings, mode, isActive])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        setIsActive((prev) => !prev)
      } else if (e.code === "Escape") {
        e.preventDefault()
        handleReset()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Toggle timer
  const toggleTimer = () => {
    setIsActive((prev) => !prev)
  }

  // Reset timer
  const handleReset = () => {
    setIsActive(false)
    if (mode === TIMER_MODES.WORK) {
      setTimeLeft(settings.work)
    } else if (mode === TIMER_MODES.SHORT_BREAK) {
      setTimeLeft(settings.shortBreak)
    } else {
      setTimeLeft(settings.longBreak)
    }
  }

  // Skip to next session
  const handleSkip = () => {
    setIsActive(false)
    handleTimerComplete()
  }

  // Update settings
  const updateSettings = (newSettings: typeof DEFAULT_SETTINGS) => {
    setSettings(newSettings)
    setShowSettings(false)
  }

  return (
    <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              {/* Progress bar */}
              <div
                className={cn("h-2 transition-all duration-1000", getBgColor())}
                style={{ width: `${progressPercentage}%` }}
              />

              {/* Session indicators */}
              <div className="flex justify-center gap-2 p-2">
                {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all",
                      i < completedSessions ? getBgColor() : "bg-gray-200 dark:bg-gray-700",
                    )}
                  />
                ))}
              </div>

              {/* Timer display */}
              <div className="flex flex-col items-center justify-center p-8">
                <h2 className={cn("text-2xl font-medium mb-4", getTextColor())}>
                  {mode === TIMER_MODES.WORK
                    ? "Focus Time"
                    : mode === TIMER_MODES.SHORT_BREAK
                      ? "Short Break"
                      : "Long Break"}
                </h2>

                <div className="relative flex items-center justify-center">
                  <svg className="w-64 h-64">
                    <circle
                      className="text-gray-200 dark:text-gray-700"
                      strokeWidth="6"
                      stroke="currentColor"
                      fill="transparent"
                      r="120"
                      cx="128"
                      cy="128"
                    />
                    <circle
                      className={cn("transition-all duration-1000", getTextColor())}
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 120}
                      strokeDashoffset={2 * Math.PI * 120 * (1 - progressPercentage / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="120"
                      cx="128"
                      cy="128"
                    />
                  </svg>

                  <span className="absolute text-5xl font-bold">{formatTime(timeLeft)}</span>
                </div>

                {/* Timer controls */}
                <div className="flex gap-4 mt-8">
                  <Button variant="outline" size="icon" onClick={handleReset} aria-label="Reset timer">
                    <RefreshCw className="w-5 h-5" />
                  </Button>

                  <Button
                    size="icon"
                    className={cn("w-14 h-14 rounded-full transition-transform hover:scale-105", getBgColor())}
                    onClick={toggleTimer}
                    aria-label={isActive ? "Pause timer" : "Start timer"}
                  >
                    {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                  </Button>

                  <Button variant="outline" size="icon" onClick={handleSkip} aria-label="Skip to next session">
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="tasks">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4">
            <TaskList />
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <PomodoroStats stats={stats} />
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                aria-label="Toggle settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>

            {showSettings ? (
              <PomodoroSettings settings={settings} onSave={updateSettings} onCancel={() => setShowSettings(false)} />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-sm text-muted-foreground">Work</div>
                    <div className="text-lg font-medium">{settings.work / 60} min</div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-sm text-muted-foreground">Short Break</div>
                    <div className="text-lg font-medium">{settings.shortBreak / 60} min</div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-sm text-muted-foreground">Long Break</div>
                    <div className="text-lg font-medium">{settings.longBreak / 60} min</div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-sm text-muted-foreground">Sessions</div>
                    <div className="text-lg font-medium">{settings.sessionsBeforeLongBreak}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-start next session</span>
                    <span>{settings.autoStartNextSession ? "On" : "Off"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifications</span>
                    <span>{settings.enableNotifications ? "On" : "Off"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sound effects</span>
                    <span>{settings.enableSounds ? "On" : "Off"}</span>
                  </div>
                </div>

                <Button className="w-full" onClick={() => setShowSettings(true)}>
                  Customize Settings
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

