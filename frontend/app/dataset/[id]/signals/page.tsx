'use client'
import { useQuery } from '@tanstack/react-query'
import { apiGet, apiPost } from '../../../../lib/api'
import { useState } from 'react'

const defaultConfig = {
  patterns: {
    frustration: ["no funciona", "problema"],
    urgency: ["urgente", "ya"],
    prior_attempt: ["intent"],
    econ_impact: ["ventas", "roas", "ctr", "cpc", "lead"],
    tech_block: ["pixel", "api", "error"],
    coldfit_neg: ["marca personal", "branding"]
  },
  weights: { frustration: 1.2, urgency: 1.1, prior_attempt: 1, econ_impact: 1.4, tech_block: 1.1, coldfit_neg: -1 }
}

export default function SignalsPage({ params }: { params: { id: string }}) {
  const [config, setConfig] = useState(JSON.stringify(defaultConfig, null, 2))
  const [job, setJob] = useState('')
  const { data } = useQuery({ queryKey: ['signals', params.id], queryFn: () => apiGet(`/api/datasets/${params.id}/signals`) })
  return <main className="p-8 space-y-4">
    <h1 className="text-xl font-bold">Signals</h1>
    <textarea className="w-full h-64 border rounded p-2 font-mono text-xs" value={config} onChange={(e) => setConfig(e.target.value)} />
    <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={async () => {
      const res = await apiPost(`/api/datasets/${params.id}/signals/recompute`, JSON.parse(config))
      setJob(res.job_id)
    }}>Recalcular</button>
    {job && <p>Job: {job}</p>}
    <pre className="bg-white border p-2 rounded text-xs overflow-auto">{JSON.stringify((data || []).slice(0, 20), null, 2)}</pre>
  </main>
}
