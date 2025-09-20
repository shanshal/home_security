import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getLocks, getLogs } from '../lib/store.js'
import ActivityLog from '../components/ActivityLog.jsx'

export default function AccessLog() {
  const { t } = useTranslation()
  const [user, setUser] = useState('')
  const [lockId, setLockId] = useState('')
  const [action, setAction] = useState('')
  const [time, setTime] = useState('all')
  const [tick, setTick] = useState(0)
  const locks = getLocks()
  const locksMap = Object.fromEntries(locks.map((l) => [l.id, l]))

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const items = useMemo(() => {
    const all = getLogs()
    const cutoff = time === '24h' ? Date.now() - 24*3600e3 : time === '7d' ? Date.now() - 7*24*3600e3 : 0
    return all.filter((e) =>
      (!user || String(e.user).toLowerCase().includes(user.toLowerCase())) &&
      (!lockId || e.lockId === lockId) &&
      (!action || e.action === action) &&
      (!cutoff || new Date(e.timestamp).getTime() >= cutoff)
    )
  }, [user, lockId, action, time, tick])

  const exportCSV = () => {
    const headers = ['timestamp','user','lock','action']
    const rows = items.map(e => [e.timestamp, e.user, locksMap[e.lockId]?.name || e.lockId, e.action])
    const csv = [headers, ...rows].map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'access-log.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const exportJSON = () => {
    const data = items.map(e => ({ ...e, lock: locksMap[e.lockId]?.name || e.lockId }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'access-log.json'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">{t('access.title')}</h1>
      </div>

      <div className="card border border-base-300 bg-base-100">
        <div className="card-body flex flex-wrap items-end gap-3">
          <label className="form-control">
            <div className="label"><span className="label-text">{t('access.user')}</span></div>
            <input className="input input-bordered" value={user} onChange={(e)=>setUser(e.target.value)} placeholder="Jane" />
          </label>
          <label className="form-control">
            <div className="label"><span className="label-text">{t('access.lock')}</span></div>
            <select className="select select-bordered" value={lockId} onChange={(e)=>setLockId(e.target.value)}>
              <option value="">—</option>
              {locks.map((l)=>(<option key={l.id} value={l.id}>{l.name}</option>))}
            </select>
          </label>
          <label className="form-control">
            <div className="label"><span className="label-text">{t('access.action')}</span></div>
            <select className="select select-bordered" value={action} onChange={(e)=>setAction(e.target.value)}>
              <option value="">—</option>
              <option value="unlock">{t('access.unlocked')}</option>
              <option value="lock">{t('access.locked')}</option>
              <option value="denied">{t('access.denied')}</option>
            </select>
          </label>
          <label className="form-control">
            <div className="label"><span className="label-text">Time</span></div>
            <select className="select select-bordered" value={time} onChange={(e)=>setTime(e.target.value)}>
              <option value="all">All</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
            </select>
          </label>
          <div className="ml-auto flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={exportCSV}>Export CSV</button>
            <button className="btn btn-secondary btn-sm" onClick={exportJSON}>Export JSON</button>
          </div>
        </div>
      </div>

      <div className="card border border-base-300 bg-base-100">
        <div className="card-body">
          <ActivityLog items={items} locksMap={locksMap} />
        </div>
      </div>
    </div>
  )
}
