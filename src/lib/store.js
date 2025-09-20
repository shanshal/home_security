// Simple localStorage-backed store for demo data

const USERS_KEY = 'ridges.users'
const SCANS_KEY = 'ridges.scans' // object map: { [userId]: Scan[] }

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function getStoredUsers() {
  return read(USERS_KEY, [])
}

export function getUserScans(userId) {
  const all = read(SCANS_KEY, {})
  return all[userId] || []
}

export function upsertUser(user) {
  const users = getStoredUsers()
  const idx = users.findIndex((u) => u.id.toLowerCase() === user.id.toLowerCase())
  const scans = getUserScans(user.id)
  const merged = {
    enrolled: true,
    lastSeen: scans[0]?.at || new Date().toISOString().slice(0, 10),
    scans: scans.length,
    ...user,
  }
  if (idx >= 0) users[idx] = { ...users[idx], ...merged }
  else users.push(merged)
  write(USERS_KEY, users)
  return merged
}

export function addScan(userId, scan) {
  const all = read(SCANS_KEY, {})
  const list = all[userId] || []
  list.unshift(scan)
  all[userId] = list
  write(SCANS_KEY, all)
  // update user aggregate
  upsertUser({ id: userId })
  return scan
}

export function clearStore() {
  write(USERS_KEY, [])
  write(SCANS_KEY, {})
}

