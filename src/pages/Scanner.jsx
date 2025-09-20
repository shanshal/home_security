import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
// Dynamically import lottie to reduce initial bundle size
let lottiePromise = null
const getLottie = async () => {
  if (!lottiePromise) {
    lottiePromise = import('lottie-web').then((m) => m.default || m)
  }
  return lottiePromise
}
import scanAnim from '../assets/Fingerprint Scan/animations/fbafd0c6-2dfc-40d3-8ec2-d0d2c866c641.json'
import Button from '../components/Button.jsx'
import { useToast } from '../components/Toaster.jsx'

export default function Scanner() {
  const { t } = useTranslation()
  const { push } = useToast()
  const [connected, setConnected] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [message, setMessage] = useState(t('scanner.msgConnectPrompt', 'Connect your scanner to begin'))
  const [captured, setCaptured] = useState(false)
  const [matching, setMatching] = useState(false)
  const [matchProgress, setMatchProgress] = useState(0)
  const [results, setResults] = useState([])
  const [minCert, setMinCert] = useState(70)
  const [selectedId, setSelectedId] = useState('')
  const [scanSeed, setScanSeed] = useState(0)
  const scanTimer = useRef(null)
  const matchTimer = useRef(null)
  const lottieRef = useRef(null)
  const lottieInstance = useRef(null)
  

  useEffect(() => {
    return () => {
      if (scanTimer.current) clearInterval(scanTimer.current)
      if (matchTimer.current) clearInterval(matchTimer.current)
      if (lottieInstance.current) {
        lottieInstance.current.destroy()
        lottieInstance.current = null
      }
    }
  }, [])

  // Initialize/refresh Lottie animation when scanning state changes
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
    try {
      setConnected(true)
      setMessage(t('scanner.msgConnected', 'Scanner connected. You can start scanning'))
      push(t('scanner.connected'), 'success')
    } catch (e) {
      setMessage(t('scanner.msgConnectFailed', 'Failed to connect to scanner'))
      push(t('common.failed'), 'error')
    }
  }

  const startMatching = () => {
    setMatching(true)
    setMatchProgress(0)
    setMessage(t('scanner.msgMatching', 'Matching captured fingerprint against database…'))
    setResults([])

    const candidates = [
      'User-0007',
      'User-0132',
      'User-0420',
      'User-1024',
      'User-2048',
      'User-4096',
      'User-8192',
    ]

    let idx = 0
    matchTimer.current = setInterval(() => {
      setMatchProgress((p) => {
        const step = 6 + Math.random() * 10
        const next = Math.min(100, p + step)

        if (idx < candidates.length && Math.random() > 0.4) {
          const name = candidates[idx++]
          const score = Math.floor(40 + Math.random() * 40)
          setResults((r) =>
            [...r, { id: name, score }]
              .sort((a, b) => b.score - a.score)
          )
        }

        if (next >= 100) {
          clearInterval(matchTimer.current)
          // finalize without asserting a definitive match; present sorted top candidates
          setMessage(t('scanner.msgMatchDone', 'Matching complete. Review top candidates by certainty.'))
          setMatching(false)
          // no success notification or confetti
        }
        return next
      })
    }, 500)
  }

  const handleStart = () => {
    if (!connected) return
    setScanning(true)
    setCaptured(false)
    setMatching(false)
    setSelectedId('')
    setMessage(t('scanner.msgPlaceFinger', 'Place your finger on the scanner'))
    setScanProgress(0)
    if (matchTimer.current) clearInterval(matchTimer.current)

    scanTimer.current = setInterval(() => {
      setScanProgress((p) => {
        const next = Math.min(100, p + Math.random() * 18 + 6)
        if (next >= 100) {
          clearInterval(scanTimer.current)
          setScanning(false)
          setCaptured(true)
          setScanSeed(Math.floor(Math.random() * 1e9))
          setMessage(t('scanner.msgScanComplete', 'Scan complete. Starting match…'))
          startMatching()
          push(t('scanner.msgMatchingStarted', 'Scan complete. Matching started'), 'info')
        }
        return next
      })
    }, 400)
  }

  const handleCancel = () => {
    if (scanTimer.current) clearInterval(scanTimer.current)
    if (matchTimer.current) clearInterval(matchTimer.current)
    setScanning(false)
    setMatching(false)
    setScanProgress(0)
    setMatchProgress(0)
    setResults([])
    setMessage(t('scanner.msgCanceled', 'Scan canceled'))
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('scanner.title')}</h1>
        <div className="flex items-center gap-2">
          <span className={`badge ${connected ? 'badge-success' : 'badge-ghost'} text-xs`}>
            {connected ? t('scanner.connected') : t('scanner.disconnected')}
          </span>
          {captured && <span className="badge badge-primary text-xs">Captured</span>}
          {matching && <span className="badge badge-info text-xs">{t('scanner.matching')}</span>}
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-base-content/70">{message}</p>
            <ul className="steps steps-horizontal lg:steps-horizontal text-xs">
              <li className={`step ${connected ? 'step-primary' : ''}`}>{t('scanner.stepConnect')}</li>
              <li className={`step ${captured ? 'step-primary' : scanning ? 'step-secondary' : ''}`}>{t('scanner.stepCapture')}</li>
              <li className={`step ${matchProgress > 0 ? 'step-secondary' : ''} ${!matching && matchProgress===100 ? 'step-primary' : ''}`}>{t('scanner.stepMatch')}</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left: Capture preview + scan progress */}
            <div className="flex flex-col items-center gap-4">
              <div className="aspect-[3/4] w-64 rounded-lg border border-base-300 bg-base-200/60 overflow-hidden relative">
                {/* Lottie container (visible during scanning) */}
                <div ref={lottieRef} className={`absolute inset-0 ${scanning ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
                {/* Overlay messages */}
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center text-base-content/50 text-sm">
                    {captured ? 'Fingerprint captured' : 'Scanner preview'}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="radial-progress text-primary" style={{"--value": scanProgress, "--size": '3rem'}} role="progressbar">
                  {Math.round(scanProgress)}%
                </div>
                <progress className="progress progress-primary w-56" value={scanProgress} max="100" />
              </div>
            </div>

            {/* Comparison moved out to full-width section below */}

            {/* Right: Database matching visualizer */}
            <div className="space-y-4">
              <div className="rounded-lg border border-base-300 bg-base-200/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-medium">{t('scanner.dbMatching')}</div>
                  <div className="text-xs text-base-content/60">{Math.round(matchProgress)}% complete</div>
                </div>
                <progress className="progress progress-info w-full" value={matchProgress} max="100" />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-base-content/60">{t('scanner.minCert')}: {minCert}%</span>
                  <input type="range" min={0} max={100} value={minCert} onChange={(e)=>setMinCert(Number(e.target.value))} className="range range-primary range-xs w-40" />
                </div>
                
              </div>

              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>{t('common.select')}</th>
                      <th>{t('common.candidate')}</th>
                      <th>{t('common.certainty')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-base-content/60">{t('common.awaitingResults')}</td>
                      </tr>
                    )}
                    {results.filter((r)=> r.score >= minCert).map((r) => (
                      <tr key={r.id} className="hover">
                        <td>
                          <input
                            type="radio"
                            name="selectedMatch"
                            className="radio radio-sm"
                            checked={selectedId === r.id}
                            onChange={() => setSelectedId(r.id)}
                            aria-label={`Select ${r.id} for comparison`}
                          />
                        </td>
                        <td className="font-mono">{r.id}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <progress className="progress progress-primary w-40" value={r.score} max="100" />
                            <span className="text-xs">{r.score}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
            </div>
          </div>

          {/* Full-width comparison section for clarity */}
          {selectedId && (
            <div className="rounded-lg border border-base-300 bg-base-100 p-4 max-w-3xl mx-auto w-full">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-medium">{t('common.comparison')}</div>
                <button className="btn btn-ghost btn-xs" onClick={() => setSelectedId('')}>{t('common.clear')}</button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs text-base-content/60">{t('common.capturedScan')}</div>
                  <div className="rounded-lg border border-base-300 bg-base-200/60 p-3 flex items-center justify-center">
                    <FingerprintPreview seed={scanSeed || 12345} width={160} height={200} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-base-content/60">{t('common.reference')} • {selectedId}</div>
                  <div className="rounded-lg border border-base-300 bg-base-200/60 p-3 flex items-center justify-center">
                    <FingerprintPreview seed={hashId(selectedId)} width={160} height={200} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleConnect}
              disabled={connected}
              className="min-w-28"
            >
              {connected ? t('scanner.connected') : t('scanner.connect')}
            </Button>

            <Button
              onClick={handleStart}
              disabled={!connected || scanning || matching}
              className="min-w-28"
            >
              {scanning ? t('scanner.scanning') : t('scanner.start')}
            </Button>

            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={!scanning && !matching}
              className="min-w-28"
            >
              {t('scanner.cancel')}
            </Button>
          </div>

          <div className="text-xs text-base-content/60">
            Tip: Replace simulated logic with your scanner SDK and a real matcher. Show live thumbnails or minutiae overlays if available.
          </div>
        </div>
      </div>
    </div>
  )
}

// Tiny deterministic hash to seed the reference preview from an ID
function hashId(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % 1000000000
}

// Lightweight synthetic fingerprint preview (demo placeholder)
function FingerprintPreview({ seed, width = 160, height = 200 }) {
  const points = useMemo(() => {
    let t = seed >>> 0
    const rand = () => {
      t += 0x6D2B79F5
      let r = Math.imul(t ^ (t >>> 15), t | 1)
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296
    }
    return Array.from({ length: 32 }).map(() => ({
      x: Math.round(rand() * (width - 20) + 10),
      y: Math.round(rand() * (height - 20) + 10),
      r: Math.max(1, Math.round(rand() * 2)),
      o: 0.35 + rand() * 0.45,
    }))
  }, [seed, width, height])

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-36">
      <defs>
        <radialGradient id="g2" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="var(--fallback-b2,oklch(var(--b2)) )" />
          <stop offset="100%" stopColor="var(--fallback-b3,oklch(var(--b3)) )" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} rx="10" fill="url(#g2)" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="currentColor" opacity={p.o} className="text-primary" />
      ))}
    </svg>
  )
}
