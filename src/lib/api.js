const API_BASE = (import.meta?.env?.VITE_API_BASE || '/api').replace(/\/$/, '')

function q(params = {}) {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') usp.append(k, String(v))
  })
  const s = usp.toString()
  return s ? `?${s}` : ''
}

export async function registerFingerprint({ file, username, fullName, signal }) {
  const url = `${API_BASE}/register`
  const fd = new FormData()
  fd.append('file', file)
  try { fd.append('image', file) } catch {}
  fd.append('username', username)
  try { fd.append('userName', username) } catch {}
  fd.append('fullName', fullName)
  try { fd.append('FullName', fullName) } catch {}
  const res = await fetch(url, { method: 'POST', body: fd, signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Register failed: ${res.status} ${res.statusText}`)
    err.details = text
    err.status = res.status
    throw err
  }
  return await res.json()
}

export async function uploadUserFingerprint({ userId, file, signal }) {
  const fd = new FormData()
  fd.append('file', file)
  try { fd.append('image', file) } catch {}
  const paths = [
    `${API_BASE}/user/${encodeURIComponent(userId)}/fingerprint`,
    `${API_BASE}/user/${encodeURIComponent(userId)}/fingerprint/`,
  ]
  let lastErr = null
  for (const url of paths) {
    const res = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' }, body: fd, signal })
    if (res.ok) {
      try { return await res.json() } catch { return true }
    }
    const text = await res.text().catch(() => '')
    const err = new Error(`Upload fingerprint failed: ${res.status} ${res.statusText}`)
    err.details = text
    err.status = res.status
    lastErr = err
    if (res.status === 404) continue
    break
  }
  throw lastErr || new Error('Upload fingerprint failed')
}

export async function matchFingerprint({ file, signal }) {
  const url = `${API_BASE}/match2`
  async function tryWith(fieldName) {
    const fd = new FormData()
    fd.append(fieldName, file)
    const res = await fetch(url, { method: 'POST', body: fd, signal })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const err = new Error(`Match failed: ${res.status} ${res.statusText}`)
      err.details = text
      err.status = res.status
      throw err
    }
    return res.json()
  }
  try {
    return await tryWith('file')
  } catch (e) {
    if (e?.status === 400 || e?.status === 415 || String(e?.details||'').toLowerCase().includes('file')) {
      try { return await tryWith('image') } catch (_) {}
    }
    try {
      const { convertFileToPng } = await import('./image.js')
      const asPng = await convertFileToPng(file)
      if (asPng && asPng !== file) {
        file = asPng
        return await tryWith('file')
      }
    } catch {}
    try {
      const b64 = await new Promise((resolve, reject) => {
        const fr = new FileReader()
        fr.onerror = () => reject(new Error('read-failed'))
        fr.onload = () => resolve(String(fr.result || '').replace(/^data:[^,]*,/, ''))
        fr.readAsDataURL(file)
      })
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ image: b64 }),
        signal,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        const err = new Error(`Match failed: ${res.status} ${res.statusText}`)
        err.details = text
        err.status = res.status
        throw err
      }
      return await res.json()
    } catch(_) {}
    throw e
  }
}

export async function fetchUser({ id, signal }) {
  const url = `${API_BASE}/user/${encodeURIComponent(id)}`
  const res = await fetch(url, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Fetch user failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return await res.json()
}

export async function updateUser({ id, username, fullName, signal }) {
  const url = `${API_BASE}/user/${encodeURIComponent(id)}`
  const body = {}
  if (username !== undefined) body.username = username
  if (fullName !== undefined) body.fullName = fullName
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Update user failed: ${res.status} ${res.statusText}`)
    err.details = text
    err.status = res.status
    throw err
  }
  return await res.json()
}

export async function deleteUser({ id, signal }) {
  const url = `${API_BASE}/user/${encodeURIComponent(id)}`
  const res = await fetch(url, { method: 'DELETE', signal })
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Delete user failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return true
}

export async function listUsers({ page = 1, pageSize = 20, signal } = {}) {
  const url = `${API_BASE}/user${q({ page, pageSize })}`
  const res = await fetch(url, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`List users failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return await res.json()
}

export async function listUserCheckins({ userId, page = 1, pageSize = 20, signal }) {
  const url = `${API_BASE}/checkin/${encodeURIComponent(userId)}${q({ page, pageSize })}`
  const res = await fetch(url, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`List checkins failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return await res.json()
}


export function getApiBase() {
  return API_BASE
}

// Home Security API helpers (OAS 3.1: users, rooms, access, logs)
// Uses separate base so it can target http://matching-api.yousified.xyz by default
const SECURITY_BASE = (import.meta?.env?.VITE_SECURITY_API_BASE || 'http://matching-api.yousified.xyz').replace(/\/$/, '')

// Users
export async function secListUsers({ signal } = {}) {
  const res = await fetch(`${SECURITY_BASE}/users/`, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`List users failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secCreateUser({ name, signal }) {
  const res = await fetch(`${SECURITY_BASE}/users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Create user failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secGetUser({ userId, signal }) {
  const res = await fetch(`${SECURITY_BASE}/users/${encodeURIComponent(userId)}`, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Get user failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secUpdateUser({ userId, name, signal }) {
  const res = await fetch(`${SECURITY_BASE}/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Update user failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secDeleteUser({ userId, signal }) {
  const res = await fetch(`${SECURITY_BASE}/users/${encodeURIComponent(userId)}`, { method: 'DELETE', signal })
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Delete user failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return true
}

// Rooms
export async function secListRooms({ signal } = {}) {
  const res = await fetch(`${SECURITY_BASE}/rooms/`, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`List rooms failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secCreateRoom({ name, state, signal }) {
  const res = await fetch(`${SECURITY_BASE}/rooms/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state ? { name, state } : { name }),
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Create room failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secGetRoom({ roomId, signal }) {
  const res = await fetch(`${SECURITY_BASE}/rooms/${encodeURIComponent(roomId)}`, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Get room failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secUpdateRoom({ roomId, name, state, signal }) {
  const res = await fetch(`${SECURITY_BASE}/rooms/${encodeURIComponent(roomId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state ? { name, state } : { name }),
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Update room failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secDeleteRoom({ roomId, signal }) {
  const res = await fetch(`${SECURITY_BASE}/rooms/${encodeURIComponent(roomId)}`, { method: 'DELETE', signal })
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Delete room failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return true
}

export async function secGetRoomByName({ roomName, signal }) {
  const res = await fetch(`${SECURITY_BASE}/rooms/name/${encodeURIComponent(roomName)}`, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Get room by name failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

// Access
export async function secListAccess({ signal } = {}) {
  const res = await fetch(`${SECURITY_BASE}/access/`, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`List access failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secCreateAccess({ data = {}, signal } = {}) {
  const res = await fetch(`${SECURITY_BASE}/access/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Create access failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secGetAccess({ accessId, signal }) {
  const res = await fetch(`${SECURITY_BASE}/access/${encodeURIComponent(accessId)}`, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Get access failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secGetUserAccess({ userId, signal }) {
  const res = await fetch(`${SECURITY_BASE}/access/user/${encodeURIComponent(userId)}`, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Get user access failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secUpdateUserAccess({ userId, data = {}, signal }) {
  const res = await fetch(`${SECURITY_BASE}/access/user/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Update user access failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secDeleteUserAccess({ userId, signal }) {
  const res = await fetch(`${SECURITY_BASE}/access/user/${encodeURIComponent(userId)}`, { method: 'DELETE', signal })
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Delete user access failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return true
}

export async function secCheckCanUnlock({ userName, roomId, signal }) {
  const res = await fetch(`${SECURITY_BASE}/access/check-access/${encodeURIComponent(userName)}/${encodeURIComponent(roomId)}`, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Check unlock failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

// Logs
export async function secListLogs({ signal } = {}) {
  const res = await fetch(`${SECURITY_BASE}/logs/`, { headers: { Accept: 'application/json' }, signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`List logs failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secCreateLog({ data = {}, signal } = {}) {
  const res = await fetch(`${SECURITY_BASE}/logs/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Create log failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secGetLogsByRoomId({ roomId, signal }) {
  const res = await fetch(`${SECURITY_BASE}/logs/room/${encodeURIComponent(roomId)}`, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Get logs by room id failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secGetLogsByRoomName({ roomName, signal }) {
  const res = await fetch(`${SECURITY_BASE}/logs/room/name/${encodeURIComponent(roomName)}`, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Get logs by room name failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}

export async function secGetLog({ logId, signal }) {
  const res = await fetch(`${SECURITY_BASE}/logs/${encodeURIComponent(logId)}`, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Get log failed: ${res.status} ${res.statusText}`)
    err.details = text
    throw err
  }
  return res.json()
}
