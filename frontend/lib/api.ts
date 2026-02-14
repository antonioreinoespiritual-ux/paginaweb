const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function apiGet(path: string) {
  const r = await fetch(`${API}${path}`, { cache: 'no-store' })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function apiPost(path: string, body?: unknown) {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function uploadCsv(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch(`${API}/api/datasets/upload`, { method: 'POST', body: fd })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}
