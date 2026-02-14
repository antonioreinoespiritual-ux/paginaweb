'use client'
import * as echarts from 'echarts'
import { useEffect, useRef } from 'react'

export function BarChart({ data }: { data: Array<{name: string, value: number}> }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    chart.setOption({
      xAxis: { type: 'category', data: data.map(d => d.name) },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: data.map(d => d.value) }],
      tooltip: {}
    })
    return () => chart.dispose()
  }, [data])
  return <div ref={ref} className="h-80 w-full" />
}
