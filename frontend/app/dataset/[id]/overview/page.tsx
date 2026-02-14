'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../../../lib/api'
import Link from 'next/link'
import { BarChart } from '../../../../components/bar-chart'

export default function Overview({ params }: { params: { id: string }}) {
  const { data: summary } = useQuery({ queryKey: ['summary', params.id], queryFn: () => apiGet(`/api/datasets/${params.id}/summary`) })
  const { data: clusters } = useQuery({ queryKey: ['clusters', params.id], queryFn: () => apiGet(`/api/datasets/${params.id}/clusters?limit=10`) })

  return <main className="p-8 space-y-6">
    <h1 className="text-2xl font-bold">Overview {params.id}</h1>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {summary && Object.entries(summary).filter(([k]) => k !== 'dataset_id').map(([k,v]) => (
        <div key={k} className="bg-white border rounded p-3"><p className="text-xs">{k}</p><p className="font-bold">{String(v)}</p></div>
      ))}
    </div>
    <div className="bg-white border rounded p-3">
      <BarChart data={(clusters || []).map((c: any) => ({ name: `C${c.cluster_id}`, value: c.cluster_score }))} />
    </div>
    <table className="w-full bg-white border">
      <thead><tr><th>ID</th><th>Nombre</th><th>Score</th><th>Size</th></tr></thead>
      <tbody>{(clusters || []).map((c: any) => <tr key={c.cluster_id} className="border-t"><td>{c.cluster_id}</td><td>{c.cluster_name}</td><td>{c.cluster_score.toFixed(2)}</td><td>{c.size}</td></tr>)}</tbody>
    </table>
    <div className="space-x-3">
      <Link className="underline" href={`/dataset/${params.id}/clusters`}>Clusters</Link>
      <Link className="underline" href={`/dataset/${params.id}/signals`}>Signals</Link>
      <Link className="underline" href={`/dataset/${params.id}/export`}>Export</Link>
    </div>
  </main>
}
