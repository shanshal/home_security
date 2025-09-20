import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { secListUsers } from '../lib/api.js'

export default function Search() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('id') || ''
  const [query, setQuery] = useState(initialQ)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
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
      const items = await secListUsers()
      const qLower = trimmed.toLowerCase()
      const filtered = (Array.isArray(items) ? items : [])
        .filter((u) => String(u.id).toLowerCase().includes(qLower) || String(u.name || '').toLowerCase().includes(qLower))
        .map((u) => ({ id: u.id, name: u.name || String(u.id) }))
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
    return `${results.length} results`
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
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-base-content/60">
                    {query.trim() ? t('search.noResults') : t('search.enterId')}
                  </td>
                </tr>
              ) : (
                paged.map((u) => (
                  <tr key={u.id} className="hover cursor-pointer" onClick={() => navigate(`/users/${encodeURIComponent(u.id)}`)}>
                    <td className="font-mono text-sm">{u.id}</td>
                    <td>{u.name}</td>
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
