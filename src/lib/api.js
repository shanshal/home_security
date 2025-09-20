// Lightweight API helper for server calls

// Use VITE_API_BASE when provided. In dev, default to '/api' and proxy via Vite to avoid CORS.
const API_BASE = (import.meta?.env?.VITE_API_BASE || '/api').replace(/\/$/, '')

// New endpoints (multipart)
export async function registerFingerprint({ file, username, signal }) {
  const url = `${API_BASE}/register`
  const fd = new FormData()
  fd.append('file', file)
  fd.append('username', username)
  const res = await fetch(url, { method: 'POST', body: fd, signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Register failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  // Spec shows 200 OK with no JSON body
  return true
}

export async function matchFingerprint({ file, signal }) {
  const url = `${API_BASE}/match`
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(url, { method: 'POST', body: fd, signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Match failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return await res.json() // { username, score, certainty, matchingTime }
}

export function getApiBase() {
  return API_BASE
}
