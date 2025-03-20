// components/ui/chart.tsx
import type React from "react"

export const ChartContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="chart-container">{children}</div>
}

export const Chart = ({ children }: { children: React.ReactNode }) => {
  return <div className="chart">{children}</div>
}

export const ChartTooltip = () => {
  return <div className="chart-tooltip"></div>
}

export const ChartLegend = () => {
  return <div className="chart-legend"></div>
}

export const ChartPie = ({ children }: { children: React.ReactNode }) => {
  return <div className="chart-pie">{children}</div>
}

export const ChartPieSeries = ({
  children,
  data,
  category,
  value,
  colorScale,
}: {
  children: React.ReactNode
  data: any[]
  category: string
  value: string
  colorScale: string[]
}) => {
  return <div className="chart-pie-series">{children}</div>
}

export const ChartPieValueLabel = () => {
  return <div className="chart-pie-value-label"></div>
}

