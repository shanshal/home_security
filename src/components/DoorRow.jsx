import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from './Button.jsx'
import LockAnimation from './LockAnimation.jsx'

export default function DoorRow({ door, onLock, onUnlock, onRemove }) {
  const { t } = useTranslation()
  const [state, setState] = useState(door.status === 'locked' ? 'locked-stop' : 'unlocked-stop')
  const [playing, setPlaying] = useState(false)
  const isLocked = door.status === 'locked'

  useEffect(() => {
    if (playing) return
    setState(door.status === 'locked' ? 'locked-stop' : 'unlocked-stop')
  }, [door.status, playing])

  return (
    <div className="flex items-center justify-between gap-3 border-0 border-b border-base-300 rounded-none py-2 md:py-2 px-0 md:px-2 overflow-hidden">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="shrink-0">
          <LockAnimation
            state={state}
            size={160}
            lockedFrame={65}
            unlockedFrame={1}
            onComplete={() => { setPlaying(false); setState(door.status === 'locked' ? 'locked-stop' : 'unlocked-stop') }}
          />
        </div>
        <div className="min-w-[8rem] max-w-[50%] flex-1">
          <div className="flex items-center gap-2">
            <div className="font-medium leading-tight truncate">{door.name}</div>
            <span className={`badge badge-sm ${isLocked ? 'badge-error' : 'badge-success'}`}>
              {isLocked ? t('security.locked') : t('security.unlocked')}
            </span>
          </div>
          <div className="text-xs text-base-content/60 truncate hidden md:block">{door.id}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="error"
          onClick={() => { onLock?.(door); setPlaying(true); setState('lock') }}
          disabled={isLocked}
        >
          {t('security.lock')}
        </Button>
        <Button
          variant="success"
          onClick={() => { onUnlock?.(door); setPlaying(true); setState('unlock') }}
          disabled={!isLocked}
        >
          {t('security.unlock')}
        </Button>
        <button className="btn btn-ghost btn-sm" onClick={() => onRemove?.(door)}>{t('security.remove')}</button>
      </div>
    </div>
  )
}
