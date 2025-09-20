const DOORS_KEY = 'security.doors'
const RULES_KEY = 'security.rules'
const LOGS_KEY = 'security.logs'

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

export function getDoors() {
  const list = read(DOORS_KEY, [])
  return list.slice().sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })
}

export function addDoor({ id, name }) {
  const doors = getDoors()
  if (!doors.find((d) => d.id === id)) {
    const next = [{ id, name, status: 'locked', history: [], createdAt: new Date().toISOString() }, ...doors]
    write(DOORS_KEY, next)
    return next
  }
  write(DOORS_KEY, doors)
  return doors
}

export function removeDoor(id) {
  const doors = getDoors().filter((d) => d.id !== id)
  write(DOORS_KEY, doors)
  return doors
}

export function setDoorStatus(id, status, actor = 'Admin') {
  const doors = getDoors()
  const d = doors.find((x) => x.id === id)
  if (d) d.status = status
  write(DOORS_KEY, doors)
  if (d) addLog({ user: actor, doorId: id, action: status === 'unlocked' ? 'unlock' : 'lock' })
  return d
}

export function getRules() {
  return read(RULES_KEY, [])
}

export function addRule(rule) {
  const rules = getRules()
  rules.unshift({ ...rule, id: rule.id || String(Date.now()) })
  write(RULES_KEY, rules)
  return rules[0]
}

export function removeRule(id) {
  const rules = getRules().filter((r) => r.id !== id)
  write(RULES_KEY, rules)
  return rules
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

export function evaluateAccess(user, doorId, date = new Date()) {
  const doors = getDoors()
  const door = doors.find((d) => d.id === doorId)
  if (door && door.status === 'unlocked') return true
  const now = date
  const current = now.toTimeString().slice(0, 5)
  const rules = getRules().filter((r) => r.user && r.doorId === doorId)
  const match = rules.find((r) => {
    if (r.user.toLowerCase() !== user.toLowerCase()) return false
    if (r.start && r.end) return current >= r.start && current <= r.end
    return true
  })
  return Boolean(match)
}
