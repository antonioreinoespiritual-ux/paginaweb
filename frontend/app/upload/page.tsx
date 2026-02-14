'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiPost, uploadCsv } from '../../lib/api'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [datasetId, setDatasetId] = useState<string>('')
  const [job, setJob] = useState<string>('')
  const router = useRouter()

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Market Gap Analyzer - Upload</h1>
      <div className="bg-white rounded border p-4 space-y-3">
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={async () => {
          if (!file) return
          const res = await uploadCsv(file)
          setDatasetId(res.dataset_id)
        }}>Subir CSV</button>

        {datasetId && <div className="space-x-2">
          <button className="px-3 py-2 bg-slate-900 text-white rounded" onClick={async () => {
            const res = await apiPost(`/api/datasets/${datasetId}/ingest`)
            setJob(res.job_id)
          }}>Ingestar</button>
          <button className="px-3 py-2 bg-emerald-600 text-white rounded" onClick={async () => {
            const res = await apiPost(`/api/datasets/${datasetId}/analyze`)
            setJob(res.job_id)
          }}>Analizar</button>
          <button className="px-3 py-2 border rounded" onClick={() => router.push(`/dataset/${datasetId}/overview`)}>Ir a Overview</button>
        </div>}
        {job && <p className="text-sm">Último job: {job}</p>}
      </div>
    </main>
  )
}
