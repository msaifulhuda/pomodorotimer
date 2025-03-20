"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface PomodoroSettingsProps {
  settings: {
    work: number
    shortBreak: number
    longBreak: number
    sessionsBeforeLongBreak: number
    autoStartNextSession: boolean
    enableNotifications: boolean
    enableSounds: boolean
  }
  onSave: (settings: PomodoroSettingsProps["settings"]) => void
  onCancel: () => void
}

// Preset templates
const PRESETS = {
  default: {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    sessionsBeforeLongBreak: 4,
  },
  deepWork: {
    work: 50 * 60,
    shortBreak: 10 * 60,
    longBreak: 30 * 60,
    sessionsBeforeLongBreak: 2,
  },
  sprint: {
    work: 20 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    sessionsBeforeLongBreak: 4,
  },
}

export default function PomodoroSettings({ settings, onSave, onCancel }: PomodoroSettingsProps) {
  const [localSettings, setLocalSettings] = useState({ ...settings })

  // Apply preset
  const applyPreset = (preset: keyof typeof PRESETS) => {
    setLocalSettings({
      ...localSettings,
      ...PRESETS[preset],
    })
  }

  // Handle input change
  const handleInputChange = (field: keyof typeof localSettings, value: string | number | boolean) => {
    setLocalSettings({
      ...localSettings,
      [field]: typeof value === "string" && !isNaN(Number(value)) ? Number(value) * 60 : value,
    })
  }

  // Handle save
  const handleSave = () => {
    // Validate inputs
    const workTime = localSettings.work / 60
    const shortBreakTime = localSettings.shortBreak / 60
    const longBreakTime = localSettings.longBreak / 60

    if (workTime < 1 || workTime > 60) {
      alert("Work time must be between 1 and 60 minutes")
      return
    }

    if (shortBreakTime < 1 || shortBreakTime > 30) {
      alert("Short break time must be between 1 and 30 minutes")
      return
    }

    if (longBreakTime < 5 || longBreakTime > 60) {
      alert("Long break time must be between 5 and 60 minutes")
      return
    }

    if (localSettings.sessionsBeforeLongBreak < 1 || localSettings.sessionsBeforeLongBreak > 10) {
      alert("Sessions before long break must be between 1 and 10")
      return
    }

    onSave(localSettings)
  }

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications")
      return
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission()

      if (permission === "granted") {
        setLocalSettings({
          ...localSettings,
          enableNotifications: true,
        })
      } else {
        setLocalSettings({
          ...localSettings,
          enableNotifications: false,
        })
        alert("Notification permission denied")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Presets</Label>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => applyPreset("default")}>
              Default
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset("deepWork")}>
              Deep Work
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset("sprint")}>
              Sprint
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="workTime">Work Time (minutes)</Label>
            <Input
              id="workTime"
              type="number"
              min="1"
              max="60"
              value={localSettings.work / 60}
              onChange={(e) => handleInputChange("work", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortBreakTime">Short Break (minutes)</Label>
            <Input
              id="shortBreakTime"
              type="number"
              min="1"
              max="30"
              value={localSettings.shortBreak / 60}
              onChange={(e) => handleInputChange("shortBreak", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longBreakTime">Long Break (minutes)</Label>
            <Input
              id="longBreakTime"
              type="number"
              min="5"
              max="60"
              value={localSettings.longBreak / 60}
              onChange={(e) => handleInputChange("longBreak", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionsCount">Sessions before Long Break</Label>
            <Input
              id="sessionsCount"
              type="number"
              min="1"
              max="10"
              value={localSettings.sessionsBeforeLongBreak}
              onChange={(e) => handleInputChange("sessionsBeforeLongBreak", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="autoStart">Auto-start next session</Label>
            <Switch
              id="autoStart"
              checked={localSettings.autoStartNextSession}
              onCheckedChange={(checked) => handleInputChange("autoStartNextSession", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Enable notifications</Label>
            <Switch
              id="notifications"
              checked={localSettings.enableNotifications}
              onCheckedChange={(checked) => {
                if (checked) {
                  requestNotificationPermission()
                } else {
                  handleInputChange("enableNotifications", false)
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sounds">Enable sounds</Label>
            <Switch
              id="sounds"
              checked={localSettings.enableSounds}
              onCheckedChange={(checked) => handleInputChange("enableSounds", checked)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  )
}

