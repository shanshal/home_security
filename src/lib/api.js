// Lightweight API helper for server calls

const API_BASE = (import.meta?.env?.VITE_API_BASE || 'https://api.yousified.xyz').replace(/\/$/, '')

export async function registerUser({ userId, name, samples }) {
  const url = `${API_BASE}/register`
  const payload = { userId, name, samples }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Register failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }

  // Prefer JSON, but tolerate empty body
  try {
    return await res.json()
  } catch {
    return null
  }
}

export function getApiBase() {
  return API_BASE
}

