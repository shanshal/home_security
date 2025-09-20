import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getLocks, getFingerprints, addFingerprint, assignFingerprint, removeFingerprint } from '../lib/store.js'
import Button from '../components/Button.jsx'
import { useToast } from '../components/Toaster.jsx'

export default function Fingerprints() {
  const { t } = useTranslation()
  const { push } = useToast()
  const locks = getLocks()
  const [search, setSearch] = useState('')
  const [fpId, setFpId] = useState('')
  const [user, setUser] = useState('')
  const [lockId, setLockId] = useState(locks[0]?.id || '')
  const [samples, setSamples] = useState([])
  const REQUIRED = 3
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)
  const [step, setStep] = useState('capture')

  useEffect(() => () => timerRef.current && clearInterval(timerRef.current), [])

  const list = useMemo(() => {
    const all = getFingerprints()
    const q = search.trim().toLowerCase()
    return q ? all.filter((f) => f.id.toLowerCase().includes(q)) : all
  }, [search, getFingerprints()])

  const capture = () => {
    if (scanning) return
    setScanning(true)
    setProgress(0)
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + Math.random() * 18 + 6)
        if (next >= 100) {
          clearInterval(timerRef.current)
          setSamples((arr) => [...arr, { id: `${fpId || 'fp'}-s-${Date.now()}`, seed: Math.floor(Math.random() * 1e9) }])
          setScanning(false)
          if (samples.length + 1 >= REQUIRED) setStep('assign')
        }
        return next
      })
    }, 400)
  }

  const enroll = () => {
    if (!fpId.trim() || !user.trim() || samples.length < REQUIRED) return
    addFingerprint({ id: fpId.trim(), user: user.trim(), lockId, samples })
    setFpId(''); setUser(''); setSamples([])
    setStep('done')
    push(t('enroll.msgSuccess'), 'success')
  }

  const assign = (id, newLockId) => {
    assignFingerprint(id, newLockId)
  }

  const remove = (id) => removeFingerprint(id)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{t('fp.title')}</h1>
        </div>
        <label className="form-control w-full sm:max-w-xs">
          <div className="label"><span className="label-text">{t('fp.searchById')}</span></div>
          <input className="input input-bordered" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="FP-1234" />
        </label>
      </div>

      <div className="card border border-base-300 bg-base-100">
        <div className="card-body grid gap-6 md:grid-cols-2 items-start">
          <ul className="steps w-full text-xs md:col-span-2">
            <li className={`step ${step==='capture' || samples.length>=1 ? 'step-primary' : ''}`}>{t('scanner.stepCapture')}</li>
            <li className={`step ${step==='assign' ? 'step-primary' : ''}`}>{t('fp.assign')}</li>
            <li className={`step ${step==='done' ? 'step-primary' : ''}`}>Done</li>
          </ul>
          <div className="space-y-3">
            <h3 className="card-title">{t('fp.enrollTitle')}</h3>
            <label className="form-control">
              <div className="label"><span className="label-text">{t('fp.fpId')}</span></div>
              <input className="input input-bordered" value={fpId} onChange={(e)=>setFpId(e.target.value)} placeholder="FP-1001" />
            </label>
            <label className="form-control">
              <div className="label"><span className="label-text">{t('fp.user')}</span></div>
              <input className="input input-bordered" value={user} onChange={(e)=>setUser(e.target.value)} placeholder="Jane Smith" />
            </label>
            <label className="form-control">
              <div className="label"><span className="label-text">{t('fp.assign')}</span></div>
              <select className="select select-bordered" value={lockId} onChange={(e)=>setLockId(e.target.value)}>
                {locks.map((l)=>(<option key={l.id} value={l.id}>{l.name}</option>))}
              </select>
            </label>
            <div className="flex items-center gap-3">
              <Button onClick={capture} disabled={scanning || samples.length>=REQUIRED}>{scanning ? t('scanner.scanning') : t('enroll.captureSample')}</Button>
              <Button variant="secondary" onClick={()=>setSamples(samples.slice(0, -1))} disabled={samples.length===0}>{t('common.remove')}</Button>
              <Button variant="secondary" onClick={()=>setSamples([])} disabled={samples.length===0}>{t('enroll.resetSamples')}</Button>
              <div className="radial-progress text-primary" style={{"--value": progress, "--size": '3rem'}} role="progressbar">{Math.round(progress)}%</div>
            </div>
            <div className="text-xs text-base-content/60">{samples.length} / 3 {t('enroll.required')}</div>
            <Button onClick={enroll} disabled={!fpId.trim() || !user.trim() || samples.length < REQUIRED}>{t('enroll.registerProfile')}</Button>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-base-content/70">{t('fp.listTitle')}</div>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>{t('fp.fpId')}</th>
                    <th>{t('fp.user')}</th>
                    <th>{t('fp.lock')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr><td colSpan={4} className="text-base-content/60">{t('fp.noResults')}</td></tr>
                  ) : list.map((f) => (
                    <tr key={f.id}>
                      <td className="font-mono">{f.id}</td>
                      <td>{f.user}</td>
                      <td>
                        <select className="select select-bordered select-sm" value={f.lockId || ''} onChange={(e)=>assign(f.id, e.target.value)}>
                          <option value="">—</option>
                          {locks.map((l)=>(<option key={l.id} value={l.id}>{l.name}</option>))}
                        </select>
                      </td>
                      <td><button className="btn btn-ghost btn-xs" onClick={()=>remove(f.id)}>{t('common.remove')}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
