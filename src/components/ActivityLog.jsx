import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export default function ActivityLog({ items, locksMap, compact=false }) {
  const { t } = useTranslation()
  const rows = useMemo(() => items || [], [items])
  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>{t('access.time')}</th>
            <th>{t('access.user')}</th>
            <th>{t('access.lock')}</th>
            <th>{t('access.action')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-base-content/60">{t('search.noResults')}</td>
            </tr>
          ) : rows.map((e, idx) => (
            <tr key={idx}>
              <td className="text-xs">{new Date(e.timestamp).toLocaleString()}</td>
              <td className="text-sm">{e.user}</td>
              <td className="text-sm">{locksMap?.[e.lockId]?.name || e.lockId}</td>
              <td>
                <span className={`badge ${e.action === 'denied' ? 'badge-error' : e.action === 'unlock' ? 'badge-success' : 'badge-ghost'}`}>
                  {e.action === 'unlock' ? t('access.unlocked') : e.action === 'lock' ? t('access.locked') : t('access.denied')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

