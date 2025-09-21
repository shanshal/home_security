import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getLocks, setLockStatus, addLockHistory, addLog, getFingerprints, assignFingerprint } from '../lib/store.js'
import ActivityLog from '../components/ActivityLog.jsx'

export default function LockDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const locks = getLocks()
  const lock = useMemo(() => locks.find((l) => l.id === id), [id, locks])

  if (!lock) {
    return (
      <div className="space-y-3">
        <div className="alert alert-warning"><span>{t('user.notFound', 'Not found')}</span></div>
        <Link to="/locks" className="btn btn-primary btn-sm">{t('common.back', 'Back')}</Link>
      </div>
    )
  }

  const handleStatus = (status) => {
    setLockStatus(lock.id, status)
    addLockHistory(lock.id, { user: 'Admin', action: status === 'locked' ? 'lock' : 'unlock' })
    addLog({ user: 'Admin', lockId: lock.id, action: status === 'locked' ? 'lock' : 'unlock' })
  }

  const locksMap = Object.fromEntries(locks.map((l) => [l.id, l]))
  const allowed = (getFingerprints() || []).filter((f) => f.lockId === lock.id)

  return (
    <div className="space-y-6">
      <div className="breadcrumbs text-sm">
        <ul>
          <li><Link to="/">{t('nav.home')}</Link></li>
          <li><Link to="/locks">{t('locks.title')}</Link></li>
          <li>{lock.name}</li>
        </ul>
      </div>

      <div className="card border border-base-300 bg-base-100">
        <div className="card-body gap-3">
          <div className="flex items-center justify-between">
            <h1 className="card-title">{lock.name}</h1>
            <span className={`badge ${lock.status === 'locked' ? 'badge-ghost' : 'badge-success'}`}>
              {lock.status === 'locked' ? t('locks.locked') : t('locks.unlocked')}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-secondary" disabled={lock.status === 'locked'} onClick={() => handleStatus('locked')}>{t('locks.lock')}</button>
            <button className="btn btn-primary" disabled={lock.status === 'unlocked'} onClick={() => handleStatus('unlocked')}>{t('locks.unlock')}</button>
            <Link to="/locks" className="btn btn-ghost">{t('common.back', 'Back')}</Link>
          </div>
        </div>
      </div>

      <div className="card border border-base-300 bg-base-100">
        <div className="card-body gap-3">
          <h2 className="card-title">{t('locks.history')}</h2>
          <ActivityLog items={lock.history || []} locksMap={locksMap} />
        </div>
      </div>

      <div className="card border border-base-300 bg-base-100">
        <div className="card-body gap-3">
          <h2 className="card-title">{t('fp.listTitle')}</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>{t('fp.fpId')}</th>
                  <th>{t('fp.user')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {allowed.length === 0 ? (
                  <tr><td colSpan={3} className="text-base-content/60">{t('fp.noResults')}</td></tr>
                ) : allowed.map((f) => (
                  <tr key={f.id}>
                    <td className="font-mono">{f.id}</td>
                    <td>{f.user}</td>
                    <td>
                      <button className="btn btn-ghost btn-xs" onClick={() => assignFingerprint(f.id, '')}>{t('common.remove')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
