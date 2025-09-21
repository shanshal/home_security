import { useParams, Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../components/Toaster.jsx'
import { secGetUser, secListLogs, secListRooms } from '../lib/api.js'

export default function UserDetail() {
  const { t } = useTranslation()
  const { push } = useToast()
  const params = useParams()
  const id = params.id || ''
  const [user, setUser] = useState(null)
  const [logs, setLogs] = useState([])
  const [roomsMap, setRoomsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overview')
  const [sortBy, setSortBy] = useState('date')
  const [order, setOrder] = useState('desc')
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerItem, setViewerItem] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const u = await secGetUser({ userId: id })
        if (cancelled) return
        setUser(u)
        const allLogs = await secListLogs({})
        if (cancelled) return
        const userLogs = (Array.isArray(allLogs) ? allLogs : [])
          .filter((l) => String(l.user_id) === String(id))
          .map((l, i) => ({ id: l.id || i, at: l.datetime || l.createdAt, room_id: l.room_id }))
        setLogs(userLogs)
        const rooms = await secListRooms({})
        if (cancelled) return
        const map = Object.fromEntries((Array.isArray(rooms)?rooms:[]).map(r => [String(r.id), r]))
        setRoomsMap(map)
      } catch {
        setError('failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const stats = useMemo(() => {
    const lastDate = logs[0]?.at ? new Date(logs[0].at).toISOString().slice(0,10) : '—'
    return { lastDate }
  }, [logs])

  const orderedLogs = useMemo(() => {
    const copy = logs.slice().sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
    if (order === 'desc') copy.reverse()
    return copy
  }, [logs, order])

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(String(user.id))
      push('User ID copied', 'success')
    } catch {
      push('Failed to copy', 'error')
    }
  }

  const mulberry32 = (seed) => {
    return function() {
      let t = (seed += 0x6D2B79F5)
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  const ScanPreview = ({ seed }) => {
    const rand = mulberry32(seed)
    const points = Array.from({ length: 28 }).map(() => ({
      x: Math.round(rand() * 140 + 10),
      y: Math.round(rand() * 180 + 10),
      r: Math.max(1, Math.round(rand() * 2)),
      o: 0.35 + rand() * 0.45,
    }))
    return (
      <svg viewBox="0 0 160 200" className="h-28 w-full">
        <defs>
          <radialGradient id="g" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="var(--fallback-b2,oklch(var(--b2)) )" />
            <stop offset="100%" stopColor="var(--fallback-b3,oklch(var(--b3)) )" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="160" height="200" rx="10" fill="url(#g)" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r}
            fill="currentColor" opacity={p.o}
            className="text-primary" />
        ))}
      </svg>
    )
  }

  const toImageSrc = (img) => {
    if (!img) return ''
    if (typeof img !== 'string') return ''
    if (img.startsWith('http') || img.startsWith('data:')) return img
    return `data:image/bmp;base64,${img}`
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="space-y-4">
          <div className="alert alert-warning"><span>{t('user.notFound', 'User not found.')}</span></div>
          <Link to="/search" className="btn btn-primary btn-sm">{t('user.backToSearch', 'Back to Search')}</Link>
        </div>
      )}
      {(!error && (loading || !user)) && (
        <div className="space-y-4">
          <div className="skeleton h-8 w-64" />
          <div className="skeleton h-24 w-full" />
        </div>
      )}
      {(!loading && user && !error) && (
        <>
      <div className="breadcrumbs text-sm">
        <ul>
          <li><Link to="/">{t('nav.home')}</Link></li>
          <li><Link to="/search">{t('nav.search')}</Link></li>
          <li>{user.id}</li>
        </ul>
      </div>

      <div className="card border border-base-300 bg-base-100 overflow-hidden">
        <div className="card-body gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="card-title truncate">{user.name || user.id}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-mono">{user.id}</span>
                <button className="btn btn-ghost btn-xs" onClick={copyId}>{t('user.copyId', 'Copy ID')}</button>
                <span className="badge badge-ghost">{t('user.lastSeen', 'Last seen')}: {stats.lastDate}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to="/scanner" className="btn btn-primary btn-sm">{t('user.verify', 'Verify')}</Link>
              <Link to="/search" className="btn btn-secondary btn-sm">{t('common.back', 'Back')}</Link>
            </div>
          </div>

          
          <div className="stats stats-vertical sm:stats-horizontal shadow border border-base-300">
            <div className="stat">
              <div className="stat-title">{t('user.totalScans', 'Total Scans')}</div>
              <div className="stat-value text-primary text-2xl">{scans.length}</div>
            </div>
            
            <div className="stat">
              <div className="stat-title">{t('user.lastScan', 'Last Scan')}</div>
              <div className="stat-value text-2xl">{stats.lastDate}</div>
            </div>
          </div>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-bordered">
        <button role="tab" className={`tab ${tab==='overview' ? 'tab-active' : ''}`} onClick={() => setTab('overview')}>{t('common.overview', 'Overview')}</button>
        <button role="tab" className={`tab ${tab==='scans' ? 'tab-active' : ''}`} onClick={() => setTab('scans')}>{t('security.logsTitle', 'Access Log')}</button>
      </div>

      {tab === 'overview' && (
        <section className="space-y-4">
          <div className="card border border-base-300 bg-base-100">
            <div className="card-body">
              <h3 className="card-title">{t('user.summary', 'Summary')}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-base-content/70">{t('search.userId')}</div>
                  <div className="font-mono">{user.id}</div>
                </div>
                <div>
                  <div className="text-sm text-base-content/70">{t('user.devices', 'Devices')}</div>
                  <div>OptiScan X2, BioWave S1</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border border-base-300 bg-base-100">
            <div className="card-body">
              <h3 className="card-title">{t('security.logsTitle', 'Access Log')}</h3>
              {orderedLogs.slice(0, 5).length === 0 ? (
                <div className="text-sm text-base-content/60">{t('user.noRecentScans', 'No recent scans')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>{t('security.time', 'Time')}</th>
                        <th>{t('security.door', 'Door')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedLogs.slice(0, 5).map((l) => (
                        <tr key={l.id}>
                          <td className="text-xs">{new Date(l.at).toLocaleString()}</td>
                          <td>{roomsMap[String(l.room_id)]?.name || l.room_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      {tab === 'scans' && (
        <section className="space-y-4">
          <div className="card border border-base-300 bg-base-100">
            <div className="card-body flex items-center gap-4">
              <div>
                <label className="label"><span className="label-text">{t('user.order', 'Order')}</span></label>
                <select className="select select-bordered select-sm" value={order} onChange={(e) => setOrder(e.target.value)}>
                  <option value="desc">{t('user.desc', 'Desc')}</option>
                  <option value="asc">{t('user.asc', 'Asc')}</option>
                </select>
              </div>
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="alert alert-ghost">
              <span className="text-sm">{t('user.noRecentScans', 'No recent scans')}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>{t('security.time', 'Time')}</th>
                    <th>{t('security.door', 'Door')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedLogs.map((l) => (
                    <tr key={l.id}>
                      <td className="text-xs">{new Date(l.at).toLocaleString()}</td>
                      <td>{roomsMap[String(l.room_id)]?.name || l.room_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      {viewerOpen && viewerItem && (
        <dialog open className="modal">
          <div className="modal-box w-11/12 max-w-md p-4">
            <img src={toImageSrc(viewerItem.image)} alt="scan" className="w-full h-auto object-contain rounded" />
            <div className="mt-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-base-content/60">{t('user.lastScan', 'Last Scan')}</span>
                <span className="badge badge-ghost">{viewerItem.at}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-base-content/60">{t('user.devices', 'Devices')}</span>
                <span className="badge badge-ghost">{viewerItem.device || '—'}</span>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-error" onClick={() => setViewerOpen(false)}>Close</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setViewerOpen(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}
        </>
      )}
    </div>
  )
}
