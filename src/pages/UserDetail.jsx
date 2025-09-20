import { useParams, Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../components/Toaster.jsx'
import { getStoredUsers, getUserScans } from '../lib/store.js'

const MOCK_USERS = [
  { id: 'User-0007', name: 'Maria Santos', enrolled: true, lastSeen: '2025-08-04', scans: 12 },
  { id: 'User-0132', name: 'Omar Khaled', enrolled: true, lastSeen: '2025-09-11', scans: 4 },
  { id: 'User-0420', name: 'Lina Chen', enrolled: false, lastSeen: '—', scans: 0 },
  { id: 'User-1024', name: 'John Doe', enrolled: true, lastSeen: '2025-09-18', scans: 27 },
  { id: 'User-2048', name: 'Jane Roe', enrolled: true, lastSeen: '2025-05-29', scans: 9 },
  { id: 'User-4096', name: 'Ali Hassan', enrolled: true, lastSeen: '2025-07-13', scans: 2 },
  { id: 'User-8192', name: 'Sofia N.', enrolled: false, lastSeen: '—', scans: 0 },
]

export default function UserDetail() {
  const { t } = useTranslation()
  const { push } = useToast()
  const params = useParams()
  const id = params.id || ''
  const stored = getStoredUsers().find((u) => u.id.toLowerCase() === id.toLowerCase())
  const user = stored || MOCK_USERS.find((u) => u.id.toLowerCase() === id.toLowerCase())

  if (!user) {
    return (
      <div className="space-y-4">
        <div className="alert alert-warning">
          <span>{t('user.notFound', 'User not found.')}</span>
        </div>
        <Link to="/search" className="btn btn-primary btn-sm">{t('user.backToSearch', 'Back to Search')}</Link>
      </div>
    )
  }

  // Generate synthetic scan history for demo
  const realScans = stored ? getUserScans(user.id) : []
  const synthetic = (() => {
    const count = user ? Math.max(0, user.scans) : 0
    return Array.from({ length: count }).map((_, i) => {
      const ts = new Date()
      ts.setDate(ts.getDate() - i * 3)
      return {
        id: `${user.id}-scan-${String(i + 1).padStart(3, '0')}`,
        at: ts.toISOString().slice(0, 10),
        device: i % 2 === 0 ? 'OptiScan X2' : 'BioWave S1',
        quality: 70 + ((i * 7) % 25),
        score: 60 + ((i * 11) % 35),
      }
    })
  })()
  const scans = realScans.length ? realScans : synthetic

  const [tab, setTab] = useState('overview')
  const [sortBy, setSortBy] = useState('date') // date | score | quality
  const [order, setOrder] = useState('desc')   // asc | desc
  const [minQuality, setMinQuality] = useState(0)

  const stats = useMemo(() => {
    if (!scans.length) return { avgQuality: 0, bestScore: 0, lastDate: '—' }
    const avgQuality = Math.round(scans.reduce((a, b) => a + b.quality, 0) / scans.length)
    const bestScore = Math.max(...scans.map((s) => s.score))
    const lastDate = scans[0]?.at || '—'
    return { avgQuality, bestScore, lastDate }
  }, [scans])

  const filteredScans = useMemo(() => {
    const copy = scans.filter((s) => s.quality >= minQuality)
    const cmp = {
      date: (a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0),
      score: (a, b) => a.score - b.score,
      quality: (a, b) => a.quality - b.quality,
    }[sortBy]
    copy.sort(cmp)
    if (order === 'desc') copy.reverse()
    return copy
  }, [scans, sortBy, order, minQuality])

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(user.id)
      push('User ID copied', 'success')
    } catch {
      push('Failed to copy', 'error')
    }
  }

  // no profile picture/avatar required

  // Tiny deterministic PRNG to render stable dot maps
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

  return (
    <div className="space-y-6">
      <div className="breadcrumbs text-sm">
        <ul>
          <li><Link to="/">{t('nav.home')}</Link></li>
          <li><Link to="/search">{t('nav.search')}</Link></li>
          <li>{user.id}</li>
        </ul>
      </div>

      {/* Profile header */}
      <div className="card border border-base-300 bg-base-100 overflow-hidden">
        <div className="card-body gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="card-title truncate">{user.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-mono">{user.id}</span>
                <button className="btn btn-ghost btn-xs" onClick={copyId}>{t('user.copyId', 'Copy ID')}</button>
                <span className={`badge ${user.enrolled ? 'badge-success' : 'badge-ghost'}`}>{user.enrolled ? t('user.enrolledYes', 'Enrolled') : t('user.enrolledNo', 'Not Enrolled')}</span>
                <span className="badge badge-ghost">{t('user.lastSeen', 'Last seen')}: {user.lastSeen}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/scanner" className="btn btn-primary btn-sm">{t('user.verify', 'Verify')}</Link>
              <Link to="/search" className="btn btn-secondary btn-sm">{t('common.back', 'Back')}</Link>
            </div>
          </div>

          {/* Quick stats */}
          <div className="stats stats-vertical sm:stats-horizontal shadow border border-base-300">
            <div className="stat">
              <div className="stat-title">{t('user.totalScans', 'Total Scans')}</div>
              <div className="stat-value text-primary text-2xl">{user.scans}</div>
            </div>
            <div className="stat">
              <div className="stat-title">{t('user.avgQuality', 'Avg Quality')}</div>
              <div className="stat-value text-2xl">{stats.avgQuality}%</div>
            </div>
            <div className="stat">
              <div className="stat-title">{t('user.bestScore', 'Best Score')}</div>
              <div className="stat-value text-2xl">{stats.bestScore}%</div>
            </div>
            <div className="stat">
              <div className="stat-title">{t('user.lastScan', 'Last Scan')}</div>
              <div className="stat-value text-2xl">{stats.lastDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-bordered">
        <button role="tab" className={`tab ${tab==='overview' ? 'tab-active' : ''}`} onClick={() => setTab('overview')}>{t('common.overview', 'Overview')}</button>
        <button role="tab" className={`tab ${tab==='scans' ? 'tab-active' : ''}`} onClick={() => setTab('scans')}>{t('user.scans', 'Scans')}</button>
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
              <h3 className="card-title">{t('user.recentScans', 'Recent Scans')}</h3>
              {filteredScans.slice(0, 3).length === 0 ? (
                <div className="text-sm text-base-content/60">{t('user.noRecentScans', 'No recent scans')}</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  {filteredScans.slice(0,3).map((s, idx) => (
                    <div key={s.id} className="rounded-lg border border-base-300">
                      <div className="p-3">
                        <ScanPreview seed={idx * 173 + (s.score ?? 50) * 19} />
                      </div>
                      <div className="px-3 pb-3 text-xs flex items-center justify-between">
                        <span className="badge badge-ghost">{s.at}</span>
                        <span className={`badge ${s.score >= 85 ? 'badge-success' : s.score >= 70 ? 'badge-info' : 'badge-ghost'}`}>{s.score != null ? `${s.score}%` : '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === 'scans' && (
        <section className="space-y-4">
          <div className="card border border-base-300 bg-base-100">
            <div className="card-body flex flex-wrap items-end gap-4">
              <div>
                <label className="label"><span className="label-text">{t('user.sortBy', 'Sort by')}</span></label>
                <select className="select select-bordered select-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="date">{t('user.date', 'Date')}</option>
                  <option value="score">{t('user.score', 'Score')}</option>
                  <option value="quality">{t('user.quality', 'Quality')}</option>
                </select>
              </div>
              <div>
                <label className="label"><span className="label-text">{t('user.order', 'Order')}</span></label>
                <select className="select select-bordered select-sm" value={order} onChange={(e) => setOrder(e.target.value)}>
                  <option value="desc">{t('user.desc', 'Desc')}</option>
                  <option value="asc">{t('user.asc', 'Asc')}</option>
                </select>
              </div>
              <div className="flex-1 min-w-[220px]">
                <label className="label"><span className="label-text">{t('user.minQuality', 'Min Quality')}: {minQuality}%</span></label>
                <input type="range" min={0} max={100} className="range range-primary" value={minQuality} onChange={(e) => setMinQuality(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {filteredScans.length === 0 ? (
            <div className="alert alert-ghost">
              <span className="text-sm">{t('user.noScansMatch', 'No scans matched your filters.')}</span>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredScans.map((s, idx) => (
                <div key={s.id} className="card border border-base-300 bg-base-100 overflow-hidden hover:shadow transition-shadow">
                  <div className="p-3">
                    <ScanPreview seed={idx * 997 + (s.score ?? 50) * 13} />
                  </div>
                  <div className="card-body py-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-mono">{s.id.split('-').slice(-1)}</div>
                        <span className="badge badge-ghost">{s.at}</span>
                      </div>
                      <div className="mt-1 text-xs text-base-content/60">{s.device}</div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                      <div>Quality: <span className="font-medium">{s.quality ?? '—'}{s.quality != null ? '%' : ''}</span></div>
                      <div>Score: <span className="font-medium">{s.score ?? '—'}{s.score != null ? '%' : ''}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          )}
        </section>
      )}
    </div>
  )
}
