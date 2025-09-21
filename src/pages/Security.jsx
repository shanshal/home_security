import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../components/Button.jsx'
import { useToast } from '../components/Toaster.jsx'
import DoorRow from '../components/DoorRow.jsx'
import { secListRooms, secCreateRoom, secDeleteRoom, secUpdateRoom, secListAccess, secCreateAccess, secDeleteUserAccess, secListLogs, secCheckCanUnlock, secCreateUser } from '../lib/api.js'
import houseAnim from '../assets/Home/animations/d44917cf-27bb-468e-93d6-f6b6e31f89da.json'

let lottieSecPromise = null
const getLottieSec = async () => {
  if (!lottieSecPromise) lottieSecPromise = import('lottie-web').then((m) => m.default || m)
  return lottieSecPromise
}

export default function Security() {
  const { t } = useTranslation()
  const { push } = useToast()
  const [doorName, setDoorName] = useState('')
  const [doors, setDoors] = useState([])
  const [rulesTick, setRulesTick] = useState(0)
  const [user, setUser] = useState('')
  const [doorId, setDoorId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [ruleAlways, setRuleAlways] = useState(false)
  const [testUser, setTestUser] = useState('')
  const [testDoorId, setTestDoorId] = useState('')
  const [decision, setDecision] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const lottieRef = useRef(null)
  const lottieInstance = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const rooms = await secListRooms({})
        const mapped = Array.isArray(rooms) ? rooms.map(r => ({ id: String(r.id ?? ''), name: r.name, status: r.state || r.status || 'locked', history: [] })) : []
        setDoors(mapped)
        setDoorId(mapped[0]?.id || '')
        setTestDoorId(mapped[0]?.id || '')
      } catch {}
      try {
        const a = await secListAccess({})
        const rr = Array.isArray(a) ? a.map(x => ({ id: x.id || `${x.user_id}-${x.room_id}` , user: String(x.user_id), doorId: String(x.room_id), start: x.from_hour, end: x.to_hour, always: x.all_time_access === true || x.all_time === true || x.always === true || x.anytime === true || (x.from_hour == null && x.to_hour == null) })) : []
        setRules(rr)
      } catch {}
      try {
        const logs = await secListLogs({})
        const arr = Array.isArray(logs) ? logs : (Array.isArray(logs?.logs) ? logs.logs : (Array.isArray(logs?.data) ? logs.data : (Array.isArray(logs?.results) ? logs.results : [])))
        const ll = arr.map((l) => {
          const ts = l.datetime || l.date_time || l.timestamp || l.time || l.createdAt || l.created_at || new Date().toISOString()
          const user = l.user_id ?? l.userId ?? l.user ?? l.username ?? l.name ?? ''
          const room = l.room_id ?? l.roomId ?? l.room?.id ?? l.room ?? l.doorId ?? l.door?.id ?? ''
          const action = l.action ?? l.status ?? (l.result === true ? 'granted' : (l.result === false ? 'denied' : ''))
          return { timestamp: ts, user: String(user), doorId: String(room), action }
        })
        setAllLogs(ll)
      } catch {}
    }
    load()
  }, [])

  useEffect(() => {
    const id = setInterval(() => setRulesTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      if (!lottieRef.current) return
      const lottie = await getLottieSec()
      if (cancelled) return
      if (!lottieInstance.current) {
        lottieInstance.current = lottie.loadAnimation({
          container: lottieRef.current,
          renderer: 'svg',
          loop: false,
          autoplay: true,
          animationData: houseAnim,
        })
        lottieInstance.current.addEventListener('complete', () => {
          try {
            const last = Math.max(0, Math.floor(lottieInstance.current.getDuration(true)) - 1)
            lottieInstance.current.goToAndStop(last, true)
          } catch {}
        })
      }
    }
    init()
    return () => {
      cancelled = true
      if (lottieInstance.current) {
        lottieInstance.current.destroy()
        lottieInstance.current = null
      }
    }
  }, [])

  const [rules, setRules] = useState([])
  const [allLogs, setAllLogs] = useState([])
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const a = await secListAccess({})
        const rr = Array.isArray(a) ? a.map(x => ({ id: x.id || `${x.user_id}-${x.room_id}`, user: String(x.user_id), doorId: String(x.room_id), start: x.from_hour, end: x.to_hour, always: x.all_time_access === true || x.all_time === true || x.always === true || x.anytime === true || (x.from_hour == null && x.to_hour == null) })) : []
        setRules(rr)
      } catch {}
      try {
        const logs = await secListLogs({})
        const arr = Array.isArray(logs) ? logs : (Array.isArray(logs?.logs) ? logs.logs : (Array.isArray(logs?.data) ? logs.data : (Array.isArray(logs?.results) ? logs.results : [])))
        const ll = arr.map((l) => {
          const ts = l.datetime || l.date_time || l.timestamp || l.time || l.createdAt || l.created_at || new Date().toISOString()
          const user = l.user_id ?? l.userId ?? l.user ?? l.username ?? l.name ?? ''
          const room = l.room_id ?? l.roomId ?? l.room?.id ?? l.room ?? l.doorId ?? l.door?.id ?? ''
          const action = l.action ?? l.status ?? (l.result === true ? 'granted' : (l.result === false ? 'denied' : ''))
          return { timestamp: ts, user: String(user), doorId: String(room), action }
        })
        setAllLogs(ll)
      } catch {}
    }, 3000)
    return () => clearInterval(id)
  }, [rulesTick])
  const sortById = (a, b) => {
    const an = Number(a.id)
    const bn = Number(b.id)
    const anIsNum = Number.isFinite(an)
    const bnIsNum = Number.isFinite(bn)
    if (anIsNum && bnIsNum) return an - bn
    return String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' })
  }
  const mapRooms = (rooms) => {
    if (!Array.isArray(rooms)) return []
    const mapped = rooms.map(r => ({ id: String(r.id ?? ''), name: r.name, status: r.state || r.status || 'locked', history: [] }))
    mapped.sort(sortById)
    return mapped
  }
  const toId = (x) => { const n = Number(x); return Number.isFinite(n) ? n : x }
  const refreshRooms = async () => {
    try {
      const rooms = await secListRooms({})
      setDoors(mapRooms(rooms))
    } catch {}
  }
  
  const today = new Date().toISOString().slice(0, 10)
  const grants = allLogs.filter((l)=>String(l.timestamp).slice(0,10)===today).length
  const denies = 0

  const [logUser, setLogUser] = useState('')
  const [logDoor, setLogDoor] = useState('')
  const [logDay, setLogDay] = useState('')
  const [logPage, setLogPage] = useState(0)
  const LOGS_PER_PAGE = 10
  const filteredLogs = useMemo(() => {
    const qUser = logUser.trim().toLowerCase()
    return allLogs.filter((e) =>
      (!qUser || String(e.user).toLowerCase().includes(qUser)) &&
      (!logDoor || e.doorId === logDoor) &&
      (!logDay || String(e.timestamp).slice(0,10) === logDay)
    )
  }, [allLogs, logUser, logDoor, logDay])
  useEffect(() => setLogPage(0), [logUser, logDoor, logDay])
  const totalLogPages = Math.max(1, Math.ceil(filteredLogs.length / LOGS_PER_PAGE))
  const pageLogs = filteredLogs.slice(logPage * LOGS_PER_PAGE, logPage * LOGS_PER_PAGE + LOGS_PER_PAGE)

  

  const handleAddDoor = async () => {
    const trimmed = doorName.trim()
    if (!trimmed) return
    await secCreateRoom({ name: trimmed, state: 'locked' })
    setDoorName('')
    const rooms = await secListRooms({})
    const next = mapRooms(rooms)
    setDoors(next)
    if (!doorId) setDoorId(next[0]?.id || '')
    if (!testDoorId) setTestDoorId(next[0]?.id || '')
  }

  const handleRemoveDoor = async (d) => {
    await secDeleteRoom({ roomId: d.id })
    const rooms = await secListRooms({})
    const next = mapRooms(rooms)
    setDoors(next)
    if (doorId === d.id) setDoorId(next[0]?.id || '')
    if (testDoorId === d.id) setTestDoorId(next[0]?.id || '')
  }

  const handleRuleAdd = async () => {
    if (!user.trim() || !doorId) return
    const userNum = Number(user.trim())
    const roomNum = Number(doorId)
    if (!Number.isFinite(userNum) || !Number.isFinite(roomNum)) { push('Enter numeric user and room IDs', 'warning'); return }
    try {
      const data = { user_id: userNum, room_id: roomNum }
      if (ruleAlways) {
        data.all_time_access = true
        data.from_hour = null
        data.to_hour = null
      } else {
        data.from_hour = start || null
        data.to_hour = end || null
      }
      await secCreateAccess({ data })
      setUser('')
      setStart('')
      setEnd('')
      setRuleAlways(false)
      setRulesTick((n) => n + 1)
      push('Rule added', 'success')
    } catch (e) {
      push('Failed to add rule', 'error')
    }
  }

  const handleTest = async () => {
    if (!testUser.trim() || !testDoorId) return
    const userNum = Number(testUser.trim())
    const roomNum = Number(testDoorId)
    if (!Number.isFinite(userNum) || !Number.isFinite(roomNum)) { push('Enter numeric user and room IDs', 'warning'); return }
    let ok = false
    try {
      const res = await secCheckCanUnlock({ userId: userNum, roomId: roomNum })
      ok = res === true || res?.result === true || res?.canUnlock === true || res?.can_unlock === true
    } catch {
      push('Failed to check access', 'error')
    }
    setDecision(ok ? 'granted' : 'denied')
    setRulesTick((n) => n + 1)
    return ok
  }

  const handleAddUser = async () => {
    const name = newUserName.trim()
    if (!name) return
    try {
      await secCreateUser({ name })
      setNewUserName('')
      push(t('security.addUserSuccess'), 'success')
    } catch (e) {
      push(t('security.addUserFailed'), 'error')
    }
  }

  const lockDoor = async (door) => {
    try { await secUpdateRoom({ roomId: toId(door.id), state: 'locked' }) } catch {}
    await refreshRooms()
  }
  const unlockDoor = async (door) => {
    try { await secUpdateRoom({ roomId: toId(door.id), state: 'unlocked' }) } catch {}
    await refreshRooms()
  }
  const lockAll = async () => {
    const items = Array.isArray(doors) ? doors : []
    await Promise.all(items.map(d => secUpdateRoom({ roomId: toId(d.id), state: 'locked' }).catch(()=>{})))
    await refreshRooms()
  }
  const unlockAll = async () => {
    const items = Array.isArray(doors) ? doors : []
    await Promise.all(items.map(d => secUpdateRoom({ roomId: toId(d.id), state: 'unlocked' }).catch(()=>{})))
    await refreshRooms()
  }

  return (
    <div className="space-y-6">
      <div className="hero rounded-xl border border-base-300 bg-base-100">
        <div className="hero-content flex-col lg:flex-row max-w-6xl mx-auto px-4 py-6 lg:py-8 gap-6 lg:gap-10">
          <div className="w-full max-w-xl lg:max-w-2xl">
            <div ref={lottieRef} className="w-full h-48 sm:h-64 lg:h-80" />
          </div>
          <div className="max-w-xl">
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight">{t('security.title')}</h1>
            <p className="mt-3 text-base-content/70">{t('security.subtitle')}</p>
            <p className="mt-2 text-sm text-base-content/60">{t('security.heroBody')}</p>
            
          </div>
        </div>
      </div>

      <div className="card border border-base-300 bg-base-100">
        <div className="card-body gap-3">
          <h2 className="card-title">{t('security.testTitle')}</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="form-control">
              <div className="label"><span className="label-text">{t('security.user')}</span></div>
              <input className="input input-bordered" value={testUser} onChange={(e)=>setTestUser(e.target.value)} placeholder="User ID (number)" />
            </label>
            <label className="form-control">
              <div className="label"><span className="label-text">{t('security.door')}</span></div>
              <select className="select select-bordered" value={testDoorId} onChange={(e)=>setTestDoorId(e.target.value)}>
                {doors.map((d)=>(<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </label>
            <Button onClick={handleTest}>{t('security.checkAccess')}</Button>
          </div>
          {decision && (
            <div className={`alert ${decision==='granted' ? 'alert-success' : 'alert-warning'}`}>
              <span>{decision==='granted' ? t('security.granted') : t('security.denied')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card border border-base-300 bg-base-100">
        <div className="card-body gap-3">
          <h2 className="card-title">{t('security.addUserTitle')}</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="form-control">
              <div className="label"><span className="label-text">{t('security.userName')}</span></div>
              <input className="input input-bordered" value={newUserName} onChange={(e)=>setNewUserName(e.target.value)} placeholder={t('security.userName')} />
            </label>
            <Button onClick={handleAddUser}>{t('security.addUser')}</Button>
          </div>
        </div>
      </div>

      <div className="stats stats-vertical sm:stats-horizontal shadow bg-base-100 border border-base-300">
        <div className="stat">
          <div className="stat-title">{t('security.doorsTitle')}</div>
          <div className="stat-value text-primary text-5xl lg:text-6xl">{doors.length}</div>
          <div className="stat-desc">{t('security.manageDoors')}</div>
        </div>
        <div className="stat">
          <div className="stat-title">{t('security.rulesTitle')}</div>
          <div className="stat-value text-secondary text-5xl lg:text-6xl">{rules.length}</div>
          <div className="stat-desc">{t('security.activeRules')}</div>
        </div>
        <div className="stat">
          <div className="stat-title">{t('security.today')}</div>
          <div className="stat-value flex items-center gap-4 text-4xl lg:text-5xl">
            <span className="text-success">{grants}</span>
            <span className="text-warning">{denies}</span>
          </div>
          <div className="stat-desc">{t('security.grantsDenies')}</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12 items-start">
        <div className="card border border-base-300 bg-base-100 lg:col-span-7 xl:col-span-8" id="doors">
          <div className="card-body gap-4">
            <h2 className="card-title">{t('security.doorsTitle')}</h2>
            <div className="flex items-end gap-2 flex-wrap">
              <label className="form-control w-full sm:max-w-xs">
                <div className="label"><span className="label-text">{t('security.doorName')}</span></div>
                <input className="input input-bordered" value={doorName} onChange={(e)=>setDoorName(e.target.value)} placeholder={t('security.doorName')} />
              </label>
              <Button onClick={handleAddDoor}>{t('security.addDoor')}</Button>
              <div className="flex items-end gap-2">
                <Button variant="error" onClick={lockAll} disabled={!doors.length}>{t('security.lockAll')}</Button>
                <Button variant="success" onClick={unlockAll} disabled={!doors.length}>{t('security.unlockAll')}</Button>
              </div>
            </div>
            <div className="grid gap-2">
              {doors.length === 0 ? (
                <div className="text-sm text-base-content/60">{t('security.noDoors')}</div>
              ) : doors.map((d, idx) => (
                <DoorRow
                  key={`${String(d.id) || d.name || idx}`}
                  door={d}
                  onLock={lockDoor}
                  onUnlock={unlockDoor}
                  onRemove={handleRemoveDoor}
                />
              ))}
            </div>
            
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100 lg:col-span-5 xl:col-span-4" id="logs">
          <div className="card-body gap-4">
            <h2 className="card-title">{t('security.logsTitle')}</h2>
            <div className="flex flex-wrap items-end gap-3">
              <label className="form-control">
                <div className="label"><span className="label-text">{t('security.user')}</span></div>
            <input className="input input-bordered" value={logUser} onChange={(e)=>setLogUser(e.target.value)} placeholder="User ID" />
              </label>
              <label className="form-control">
                <div className="label"><span className="label-text">{t('security.door')}</span></div>
                <select className="select select-bordered" value={logDoor} onChange={(e)=>setLogDoor(e.target.value)}>
                  <option value="">—</option>
                  {doors.map((d)=>(<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </label>
              <label className="form-control">
                <div className="label"><span className="label-text">{t('security.day')}</span></div>
                <input type="date" className="input input-bordered" value={logDay} onChange={(e)=>setLogDay(e.target.value)} />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm md:table-md">
                <thead>
                  <tr>
                    <th>{t('security.time')}</th>
                    <th>{t('security.user')}</th>
                    <th>{t('security.door')}</th>
                    <th>{t('security.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLogs.length === 0 ? (
                    <tr><td colSpan={4} className="text-base-content/60">{t('security.noLogs')}</td></tr>
                  ) : pageLogs.map((e, i) => (
                    <tr key={i + logPage*LOGS_PER_PAGE}>
                      <td className="font-mono text-xs">{new Date(e.timestamp).toLocaleString()}</td>
                      <td>{e.user}</td>
                      <td>{doors.find((d)=>String(d.id)===String(e.doorId))?.name || e.doorId}</td>
                      <td>{e.action || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between pt-2">
              <button className="btn btn-ghost btn-sm" onClick={()=>setLogPage((p)=>Math.max(0, p-1))} disabled={logPage===0}>{t('common.prev')}</button>
              <div className="text-xs text-base-content/60">{logPage+1} / {totalLogPages}</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setLogPage((p)=>Math.min(totalLogPages-1, p+1))} disabled={totalLogPages<=1 || logPage>=totalLogPages-1}>{t('common.next')}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border border-base-300 bg-base-100" id="rules">
        <div className="card-body gap-4 overflow-hidden">
          <h2 className="card-title">{t('security.rulesTitle')}</h2>
          <div className="grid gap-4 md:grid-cols-2 items-start">
            <div className="space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <label className="form-control">
                  <div className="label"><span className="label-text">{t('security.user')}</span></div>
                  <input className="input input-bordered" value={user} onChange={(e)=>setUser(e.target.value)} placeholder="User ID (number)" />
                </label>
                <label className="form-control">
                  <div className="label"><span className="label-text">{t('security.door')}</span></div>
                  <select className="select select-bordered" value={doorId} onChange={(e)=>setDoorId(e.target.value)}>
                    <option value="">—</option>
                    {doors.map((d)=>(<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                </label>
              </div>
              <div className="form-control">
                <div className="label"><span className="label-text">{t('security.window')}</span></div>
                <div className="join">
                  <input type="time" className="input input-bordered join-item" value={start} onChange={(e)=>setStart(e.target.value)} disabled={ruleAlways} />
                  <div className="join-item px-2 text-sm text-base-content/60">{t('security.to')}</div>
                  <input type="time" className="input input-bordered join-item" value={end} onChange={(e)=>setEnd(e.target.value)} disabled={ruleAlways} />
                </div>
              </div>
              <label className="label cursor-pointer w-fit gap-3">
                <span className="label-text">{t('security.always')}</span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={ruleAlways}
                  onChange={(e)=>{ const v = e.target.checked; setRuleAlways(v); if (v) { setStart(''); setEnd('') } }}
                />
              </label>
              <Button onClick={handleRuleAdd}>{t('security.addRule')}</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>{t('security.user')}</th>
                    <th>{t('security.door')}</th>
                    <th>{t('security.window')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rules.length === 0 ? (
                    <tr><td colSpan={4} className="text-base-content/60">{t('security.noRules')}</td></tr>
                  ) : rules.map((r) => (
                    <tr key={r.id}>
                      <td>{r.user}</td>
                      <td>{doors.find((d)=>String(d.id)===String(r.doorId))?.name || r.doorId}</td>
                      <td>{r.always || (!r.start && !r.end) ? t('security.anytime') : `${r.start} – ${r.end}`}</td>
                      <td><button className="btn btn-ghost btn-xs" onClick={async()=>{ await secDeleteUserAccess({ userId: r.user }); setRulesTick((n)=>n+1) }}>{t('security.remove')}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  )
}
