import PomodoroTimer from "@/components/pomodoro-timer"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Pomodoro Timer</h1>
        <PomodoroTimer />
      </div>
    </main>
  )
}

