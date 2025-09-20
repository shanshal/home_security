import { useEffect, useRef, useState, useMemo } from 'react'
import { addScan, upsertUser } from '../lib/store.js'
import { useToast } from '../components/Toaster.jsx'
import Button from '../components/Button.jsx'
import { useTranslation } from 'react-i18next'

// lazy lottie load reused from Scanner pattern
let lottiePromise = null
const getLottie = async () => {
  if (!lottiePromise) {
    lottiePromise = import('lottie-web').then((m) => m.default || m)
  }
  return lottiePromise
}
import scanAnim from '../assets/Fingerprint Scan/animations/fbafd0c6-2dfc-40d3-8ec2-d0d2c866c641.json'

export default function Enroll() {
  const { t } = useTranslation()
  const { push } = useToast()
  const notify = (msg, type) => setTimeout(() => push(msg, type), 0)
  const [connected, setConnected] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [samples, setSamples] = useState([])
  const [name, setName] = useState('')
  const [userId, setUserId] = useState('')
  const [message, setMessage] = useState(t('enroll.msgConnect', 'Connect a scanner to enroll'))
  const REQUIRED = 3
  const timerRef = useRef(null)
  const lottieRef = useRef(null)
  const lottieInstance = useRef(null)

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (lottieInstance.current) lottieInstance.current.destroy()
  }, [])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      if (!lottieRef.current) return
      const lottie = await getLottie()
      if (cancelled) return
      if (!lottieInstance.current) {
        lottieInstance.current = lottie.loadAnimation({
          container: lottieRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: false,
          animationData: scanAnim,
        })
      }
      if (scanning) lottieInstance.current.play()
      else lottieInstance.current.stop()
    }
    init()
    return () => { cancelled = true }
  }, [scanning])

  

  const handleConnect = async () => {
    setConnected(true)
    setMessage(t('enroll.msgConnected', 'Scanner connected. Capture 3 samples to enroll.'))
    notify(t('scanner.connected'), 'success')
  }

  // tiny PRNG for visual seed
  const mulberry32 = (seed) => {
    return function() {
      let t = (seed += 0x6D2B79F5)
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  const SamplePreview = ({ seed }) => {
    const rand = useMemo(() => mulberry32(seed), [seed])
    const points = useMemo(() => Array.from({ length: 20 }).map(() => ({
      x: Math.round(rand() * 60 + 10),
      y: Math.round(rand() * 80 + 10),
      r: Math.max(1, Math.round(rand() * 2)),
      o: 0.35 + rand() * 0.45,
    })), [rand])
    return (
      <svg viewBox="0 0 80 100" className="h-12 w-10">
        <rect x="0" y="0" width="80" height="100" rx="8" className="fill-base-200" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} className="fill-primary" opacity={p.o} />
        ))}
      </svg>
    )
  }

  const captureSample = () => {
    if (!connected || scanning) return
    setScanning(true)
    setMessage(t('enroll.msgCapturing', 'Capturing sample… Place finger on the scanner'))
    setProgress(0)
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + Math.random() * 18 + 6)
        if (next >= 100) {
          clearInterval(timerRef.current)
          const sample = {
            id: `${userId || 'new'}-enroll-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
            at: new Date().toISOString().slice(0, 10),
            device: 'OptiScan X2',
            seed: Math.floor(Math.random() * 1e9),
          }
          setSamples((arr) => [...arr, sample])
          setMessage(t('enroll.msgCaptured', 'Sample captured'))
          setScanning(false)
          notify(t('enroll.msgCaptured', 'Sample captured'), 'info')
        }
        return next
      })
    }, 400)
  }

  const removeSample = (idx) => {
    setSamples((arr) => arr.filter((_, i) => i !== idx))
  }

  const handleRegister = async () => {
    const id = userId.trim()
    const fullName = name.trim()
    if (!id || !fullName || samples.length < REQUIRED) return

    try {
      const user = upsertUser({ id, name: fullName, enrolled: true })
      samples.forEach((s) => addScan(user.id, s))
      notify(t('enroll.msgSuccess', 'Profile registered successfully'), 'success')
      setSamples([])
      setUserId('')
      setName('')
    } catch (err) {
      console.error(err)
      notify(t('enroll.msgFailed', 'Registration failed'), 'error')
    }
  }

  const ready = userId.trim() && name.trim() && samples.length >= REQUIRED

  return (
    <div className="mx-auto max-w-5xl px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('enroll.title', 'Enroll New Profile')}</h1>
        <span className={`badge ${connected ? 'badge-success' : 'badge-ghost'}`}>{connected ? t('scanner.connected') : t('scanner.disconnected')}</span>
      </div>

      {/* Steps */}
      <div className="w-full">
        <ul className="steps w-full text-xs">
          <li className={`step ${connected ? 'step-primary' : ''}`}>{t('scanner.stepConnect')}</li>
          <li className={`step ${samples.length >= REQUIRED ? 'step-primary' : samples.length > 0 ? 'step-secondary' : ''}`}>{t('enroll.captureNSamples', { count: REQUIRED, defaultValue: `Capture ${REQUIRED} Samples` })}</li>
          <li className={`step ${ready ? 'step-primary' : ''}`}>{t('enroll.register', 'Register')}</li>
        </ul>
      </div>

      <div className="card border border-base-300 bg-base-100">
        <div className="card-body grid gap-8 md:grid-cols-2 items-start">
          {/* Left: Form */}
          <div className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text p-2">{t('search.userId')}</span></label>
              <input className="input input-bordered w-full" value={userId} onChange={(e)=>setUserId(e.target.value)} placeholder="e.g. User-9001" />
              <label className="label"><span className="label-text-alt">{t('enroll.userIdHint', 'Letters, numbers, and dashes only')}</span></label>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text p-2">{t('enroll.fullName', 'Full Name')}</span></label>
              <input className="input input-bordered w-full" value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g. Jane Smith" />
              <label className="label"><span className="label-text-alt">{t('enroll.fullNameHint', 'Will appear on profile and reports')}</span></label>
            </div>
            {/* No file upload: local-only demo */}
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={handleConnect} disabled={connected} className="min-w-28">{t('scanner.connect')}</Button>
              <Button onClick={captureSample} disabled={!connected || scanning} className="min-w-28">{t('enroll.captureSample', 'Capture Sample')}</Button>
              <Button variant="secondary" onClick={()=>{setSamples([]); setProgress(0);}} disabled={samples.length===0} className="min-w-28">{t('enroll.resetSamples', 'Reset Samples')}</Button>
            </div>
            <p className="text-sm text-base-content/70">{message}</p>
            <div className="flex items-center gap-4">
              <div className="radial-progress text-primary" style={{"--value": progress, "--size": '3rem'}} role="progressbar">{Math.round(progress)}%</div>
              <progress className="progress progress-primary w-40" value={progress} max={100} />
            </div>
          </div>

          {/* Right: Live preview */}
          <div className="flex flex-col items-center gap-4">
            <div className="aspect-[3/4] w-64 md:w-72 rounded-lg border border-base-300 bg-base-200/60 overflow-hidden relative">
              <div ref={lottieRef} className={`absolute inset-0 ${scanning ? 'opacity-100' : 'opacity-60'} transition-opacity`} />
            </div>
            <div className="text-xs text-base-content/60 text-center">{t('enroll.livePreview', 'Live preview during capture')}</div>
          </div>
        </div>
      </div>

      {/* Samples list */}
      <div className="card border border-base-300 bg-base-100">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title">{t('enroll.capturedSamples', 'Captured Samples')}</h2>
            <div className="text-xs text-base-content/60">{samples.length} / {REQUIRED} {t('enroll.required', 'required')}</div>
          </div>
          {samples.length === 0 ? (
            <div className="text-sm text-base-content/60">{t('enroll.noSamplesYet', 'No samples yet. Capture at least 3 samples to enroll.')}</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {samples.map((s, idx) => (
                <div key={s.id} className="rounded-lg border border-base-300 p-3 flex items-center gap-3 text-sm">
                  <SamplePreview seed={(s.seed ?? idx) + idx * 37} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono truncate">{s.id.split('-').slice(-1)}</div>
                    <div className="text-xs text-base-content/60 truncate">{s.at} • {s.device}</div>
                  </div>
                  <button className="btn btn-ghost btn-xs" onClick={()=>removeSample(idx)}>{t('common.remove', 'Remove')}</button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Button onClick={handleRegister} disabled={!userId.trim() || !name.trim() || samples.length < REQUIRED}>
              {t('enroll.registerProfile', 'Register Profile')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
