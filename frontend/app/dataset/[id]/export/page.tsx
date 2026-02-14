'use client'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
export default function ExportPage({ params }: { params: { id: string }}) {
  return <main className="p-8 space-y-3">
    <h1 className="text-xl font-bold">Export</h1>
    <a className="block underline" href={`${API}/api/datasets/${params.id}/export/clusters.csv`}>Descargar clusters.csv</a>
    <a className="block underline" href={`${API}/api/datasets/${params.id}/export/evidence.csv`}>Descargar evidence.csv</a>
    <a className="block underline" href={`${API}/api/datasets/${params.id}/export/report.json`}>Descargar report.json</a>
  </main>
}
