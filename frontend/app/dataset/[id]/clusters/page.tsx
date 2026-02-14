'use client'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../../../lib/api'
import { useState } from 'react'

export default function ClustersPage({ params }: { params: { id: string }}) {
  const [selected, setSelected] = useState<number | null>(null)
  const { data } = useQuery({ queryKey: ['clusters', params.id], queryFn: () => apiGet(`/api/datasets/${params.id}/clusters?limit=100`) })
  const { data: detail } = useQuery({
    queryKey: ['cluster-detail', params.id, selected],
    queryFn: () => apiGet(`/api/clusters/${selected}?dataset_id=${params.id}`),
    enabled: selected !== null
  })

  return <main className="p-8 grid grid-cols-2 gap-4">
    <div>
      <h1 className="text-xl font-bold mb-2">Clusters</h1>
      <table className="w-full bg-white border text-sm"><thead><tr><th>ID</th><th>Nombre</th><th>Score</th></tr></thead>
        <tbody>{(data || []).map((c: any) => <tr key={c.cluster_id} className="border-t cursor-pointer" onClick={() => setSelected(c.cluster_id)}><td>{c.cluster_id}</td><td>{c.cluster_name}</td><td>{c.cluster_score.toFixed(1)}</td></tr>)}</tbody>
      </table>
    </div>
    <div className="bg-white border rounded p-3">
      <h2 className="font-semibold">Detalle Cluster</h2>
      {detail && <div className="space-y-2 text-sm">
        <p>{detail.cluster.cluster_name}</p>
        <p>Keywords: {detail.cluster.keywords_json}</p>
        <p>Ngrams: {detail.cluster.top_ngrams_json}</p>
        <ul>{detail.evidence.map((e: any) => <li key={e.rank}>#{e.rank} {e.comment}</li>)}</ul>
      </div>}
    </div>
  </main>
}
