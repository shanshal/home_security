import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getStoredUsers } from '../lib/store.js'

// Mocked database records. Replace with your real API/database.
const MOCK_USERS = [
  { id: 'User-0007', name: 'Maria Santos', enrolled: true, lastSeen: '2025-08-04', scans: 12 },
  { id: 'User-0132', name: 'Omar Khaled', enrolled: true, lastSeen: '2025-09-11', scans: 4 },
  { id: 'User-0420', name: 'Lina Chen', enrolled: false, lastSeen: '—', scans: 0 },
  { id: 'User-1024', name: 'John Doe', enrolled: true, lastSeen: '2025-09-18', scans: 27 },
  { id: 'User-2048', name: 'Jane Roe', enrolled: true, lastSeen: '2025-05-29', scans: 9 },
  { id: 'User-4096', name: 'Ali Hassan', enrolled: true, lastSeen: '2025-07-13', scans: 2 },
  { id: 'User-8192', name: 'Sofia N.', enrolled: false, lastSeen: '—', scans: 0 },
]

export default function Search() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('id') || ''
  const [query, setQuery] = useState(initialQ)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 5
  const debounceRef = useRef(null)

  const runSearch = async (q) => {
    setError('')
    const trimmed = q.trim()
    if (!trimmed) {
      setResults([])
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    try {
      const qLower = trimmed.toLowerCase()
      const dynamicUsers = getStoredUsers()
      const pool = [...MOCK_USERS, ...dynamicUsers]
      const filtered = pool.filter((u) => u.id.toLowerCase().includes(qLower))
      setResults(filtered)
      setPage(1)
      if (filtered.length === 0) setError(t('search.noResults'))
    } catch {
      setError(t('common.searchFailed', 'Search failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e?.preventDefault()
    setSearchParams(query ? { id: query } : {})
    runSearch(query)
  }

  // Debounce query input
  useEffect(() => {
    setSearchParams(query ? { id: query } : {})
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runSearch(query)
    }, 500)
    return () => debounceRef.current && clearTimeout(debounceRef.current)
  }, [query])

  const summary = useMemo(() => {
    if (results.length === 0) return ''
    const enrolled = results.filter((r) => r.enrolled).length
    return `${enrolled}/${results.length} enrolled`
  }, [results])

  const totalPages = Math.max(1, Math.ceil(results.length / pageSize))
  const paged = results.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{t('search.title')}</h1>
          <p className="text-sm text-base-content/70">{t('search.subtitle')}</p>
        </div>
        {summary && <div className="badge badge-ghost text-xs">{summary}</div>}
      </div>

      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body gap-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
            <label className="form-control w-full md:max-w-sm">
              <div className="label">
                <span className="label-text">{t('search.userId')}</span>
                <span className="label-text-alt">{t('search.example')}</span>
              </div>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Enter user id…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button type="submit" className={`btn btn-primary md:self-end ${loading ? 'loading' : ''}`}>
              {loading ? t('search.searching', 'Searching…') : t('search.search')}
            </button>
          </form>

          {error && (
            <div className="alert alert-warning">
              <span className="text-sm">{error}</span>
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-3">
              <div className="skeleton h-8 w-32" />
              <div className="skeleton h-8 w-24" />
              <div className="skeleton h-8 w-40" />
            </div>
          )}
        </div>
      </div>

      <div className="card border border-base-300 bg-base-100">
        <div className="card-body p-0 overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>{t('search.thUserId', 'User ID')}</th>
                <th>{t('search.thName', 'Name')}</th>
                <th>{t('search.thEnrolled', 'Enrolled')}</th>
                <th>{t('search.thLastSeen', 'Last Seen')}</th>
                <th>{t('search.thScans', 'Scans')}</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-base-content/60">
                    {query.trim() ? t('search.noResults') : t('search.enterId')}
                  </td>
                </tr>
              ) : (
                paged.map((u) => (
                  <tr key={u.id}>
                    <td className="font-mono text-sm">
                      <Link to={`/users/${encodeURIComponent(u.id)}`} className="link link-primary">
                        {u.id}
                      </Link>
                    </td>
                    <td>{u.name}</td>
                    <td>
                      <span className={`badge ${u.enrolled ? 'badge-success' : 'badge-ghost'}`}>
                        {u.enrolled ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>{u.lastSeen}</td>
                    <td>{u.scans}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between p-4">
            <div className="text-xs text-base-content/60">{t('common.pageOf', { page, total: totalPages, defaultValue: `Page ${page} of ${totalPages}` })}</div>
            <div className="join">
              <button className="btn btn-sm join-item" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('common.prev', 'Prev')}</button>
              <button className="btn btn-sm join-item" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{t('common.next', 'Next')}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-base-content/60">
        {t('search.hint', 'Replace mocked data with an API call. For large datasets, add pagination and server-side filtering (e.g., query param ?id=).')}
      </div>
    </div>
  )
}
