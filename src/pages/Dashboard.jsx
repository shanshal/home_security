import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LockCard from '../components/LockCard.jsx'
import { addLock, getLocks, setLockStatus, addLockHistory, addLog } from '../lib/store.js'
import { useToast } from '../components/Toaster.jsx'

export default function Dashboard() {
  const { t } = useTranslation()
  const { push } = useToast()
  const [locks, setLocks] = useState(getLocks())

  useEffect(() => {
    if (getLocks().length === 0) {
      addLock({ id: 'front-door', name: t('locks.frontDoor') })
      addLock({ id: 'garage', name: t('locks.garage') })
      addLock({ id: 'office', name: t('locks.office') })
      setLocks(getLocks())
    }
  }, [])

  const handleLock = (l) => {
    setLockStatus(l.id, 'locked')
    addLockHistory(l.id, { user: 'System', action: 'lock' })
    addLog({ user: 'System', lockId: l.id, action: 'lock' })
    setLocks(getLocks())
    push(`${l.name} ${t('access.locked').toLowerCase()}`, 'info')
  }
  const handleUnlock = (l) => {
    setLockStatus(l.id, 'unlocked')
    addLockHistory(l.id, { user: 'System', action: 'unlock' })
    addLog({ user: 'System', lockId: l.id, action: 'unlock' })
    setLocks(getLocks())
    push(`${l.name} ${t('access.unlocked').toLowerCase()}`, 'success')
  }

  const lockAll = () => {
    getLocks().forEach((l) => {
      setLockStatus(l.id, 'locked')
      addLockHistory(l.id, { user: 'Admin', action: 'lock' })
      addLog({ user: 'Admin', lockId: l.id, action: 'lock' })
    })
    setLocks(getLocks())
    push('All locks secured', 'info')
  }

  const unlockAll = () => {
    getLocks().forEach((l) => {
      setLockStatus(l.id, 'unlocked')
      addLockHistory(l.id, { user: 'Admin', action: 'unlock' })
      addLog({ user: 'Admin', lockId: l.id, action: 'unlock' })
    })
    setLocks(getLocks())
    push('All locks unlocked', 'success')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">{t('nav.home')} — {t('locks.manage')}</h1>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={lockAll}>Lock All</button>
          <button className="btn btn-primary btn-sm" onClick={unlockAll}>Unlock All</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locks.map((l) => (
          <LockCard key={l.id} lock={l} onLock={handleLock} onUnlock={handleUnlock} />
        ))}
      </div>
    </div>
  )
}
