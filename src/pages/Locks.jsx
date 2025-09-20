import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LockCard from '../components/LockCard.jsx'
import { addLock, getLocks, removeLock, setLockStatus, addLockHistory, addLog } from '../lib/store.js'
import { useToast } from '../components/Toaster.jsx'

export default function Locks() {
  const { t } = useTranslation()
  const { push } = useToast()
  const [name, setName] = useState('')
  const [locks, setLocks] = useState(getLocks())

  useEffect(() => {
    const id = setInterval(() => setLocks(getLocks()), 1000)
    return () => clearInterval(id)
  }, [])

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = trimmed.toLowerCase().replace(/\s+/g, '-')
    addLock({ id, name: trimmed })
    setName('')
    setLocks(getLocks())
  }

  const handleRemove = (l) => {
    removeLock(l.id)
    setLocks(getLocks())
  }

  const handleLock = (l) => {
    setLockStatus(l.id, 'locked')
    addLockHistory(l.id, { user: 'Admin', action: 'lock' })
    addLog({ user: 'Admin', lockId: l.id, action: 'lock' })
    setLocks(getLocks())
    push(`${l.name} ${t('access.locked').toLowerCase()}`, 'info')
  }
  const handleUnlock = (l) => {
    setLockStatus(l.id, 'unlocked')
    addLockHistory(l.id, { user: 'Admin', action: 'unlock' })
    addLog({ user: 'Admin', lockId: l.id, action: 'unlock' })
    setLocks(getLocks())
    push(`${l.name} ${t('access.unlocked').toLowerCase()}`, 'success')
  }

  const list = locks

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('locks.title')}</h1>
        <Link to="/scanner" className="btn btn-primary btn-sm">Scanner</Link>
      </div>

      <div className="card border border-base-300 bg-base-100">
        <div className="card-body gap-3">
          <div className="flex gap-2 items-end flex-wrap">
            <label className="form-control">
              <div className="label"><span className="label-text">{t('locks.name')}</span></div>
              <input className="input input-bordered" value={name} onChange={(e)=>setName(e.target.value)} placeholder={t('locks.name')} />
            </label>
            <button className="btn btn-primary" onClick={handleAdd}>{t('locks.add')}</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((l) => (
          <LockCard key={l.id} lock={l} onLock={handleLock} onUnlock={handleUnlock} onRemove={handleRemove} />
        ))}
      </div>
    </div>
  )
}
