const USERS_KEY = 'ridges.users'
const SCANS_KEY = 'ridges.scans'
const LOCKS_KEY = 'ridges.locks'
const LOGS_KEY = 'ridges.lockLogs'
const FINGERPRINTS_KEY = 'ridges.fingerprints'

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
  upsertUser({ id: userId })
  return scan
}

export function clearStore() {
  write(USERS_KEY, [])
  write(SCANS_KEY, {})
}

export function getLocks() {
  return read(LOCKS_KEY, [])
}

export function addLock({ id, name }) {
  const locks = getLocks()
  if (!locks.find((l) => l.id === id)) {
    locks.unshift({ id, name, status: 'locked', history: [], createdAt: new Date().toISOString() })
  }
  write(LOCKS_KEY, locks)
  return locks
}

export function removeLock(id) {
  const locks = getLocks().filter((l) => l.id !== id)
  write(LOCKS_KEY, locks)
  return locks
}

export function setLockStatus(id, status) {
  const locks = getLocks()
  const l = locks.find((x) => x.id === id)
  if (l) l.status = status
  write(LOCKS_KEY, locks)
  return l
}

export function addLockHistory(lockId, entry) {
  const locks = getLocks()
  const l = locks.find((x) => x.id === lockId)
  const rec = { timestamp: new Date().toISOString(), lockId, ...entry }
  if (l) {
    l.history = [rec, ...(l.history || [])]
    write(LOCKS_KEY, locks)
  }
  return rec
}

export function getLogs() {
  return read(LOGS_KEY, [])
}

export function addLog(entry) {
  const logs = getLogs()
  logs.unshift({ timestamp: new Date().toISOString(), ...entry })
  write(LOGS_KEY, logs)
  return logs[0]
}

export function getFingerprints() {
  return read(FINGERPRINTS_KEY, [])
}

export function addFingerprint(fp) {
  const list = getFingerprints()
  const idx = list.findIndex((f) => f.id.toLowerCase() === fp.id.toLowerCase())
  const next = { id: fp.id, user: fp.user, lockId: fp.lockId || '', samples: fp.samples || [], createdAt: new Date().toISOString() }
  if (idx >= 0) list[idx] = { ...list[idx], ...next }
  else list.unshift(next)
  write(FINGERPRINTS_KEY, list)
  return next
}

export function assignFingerprint(id, newLockId) {
  const list = getFingerprints()
  const f = list.find((x) => x.id === id)
  if (f) f.lockId = newLockId || ''
  write(FINGERPRINTS_KEY, list)
  return f
}

export function removeFingerprint(id) {
  const list = getFingerprints().filter((f) => f.id !== id)
  write(FINGERPRINTS_KEY, list)
  return true
}
