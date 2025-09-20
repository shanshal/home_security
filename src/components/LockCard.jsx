import Button from './Button.jsx'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function LockCard({ lock, onLock, onUnlock, onRemove }) {
  const { t } = useTranslation()
  const statusBadge = (
    <span className={`badge ${lock.status === 'locked' ? 'badge-ghost' : 'badge-success'}`}>
      {lock.status === 'locked' ? t('locks.locked') : t('locks.unlocked')}
    </span>
  )
  return (
    <div className="card border border-base-300 bg-base-100">
      <div className="card-body gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold truncate">
            <span className={`inline-flex h-6 w-6 items-center justify-center rounded ${lock.status === 'locked' ? 'bg-base-300' : 'bg-primary/20'}`} aria-hidden>
              {lock.status === 'locked' ? '🔒' : '🔓'}
            </span>
            <Link to={`/locks/${encodeURIComponent(lock.id)}`}>{lock.name}</Link>
          </div>
          {statusBadge}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => onLock?.(lock)} disabled={lock.status === 'locked'}>
            {t('locks.lock')}
          </Button>
          <Button onClick={() => onUnlock?.(lock)} disabled={lock.status === 'unlocked'}>
            {t('locks.unlock')}
          </Button>
          {onRemove && (
            <button className="btn btn-ghost btn-sm" onClick={() => onRemove(lock)}>{t('locks.remove')}</button>
          )}
        </div>
      </div>
    </div>
  )
}
