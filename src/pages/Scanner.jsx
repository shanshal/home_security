import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
let lottiePromise = null
const getLottie = async () => {
  if (!lottiePromise) {
    lottiePromise = import('lottie-web').then((m) => m.default || m)
  }
  return lottiePromise
}
import scanAnim from '../assets/Fingerprint Scan/animations/fbafd0c6-2dfc-40d3-8ec2-d0d2c866c641.json'
import Button from '../components/Button.jsx'
import { matchFingerprint } from '../lib/api.js'
import { useWebSocket } from '../lib/useWebSocket.js'
import { ensurePngFileFromBase64, ensureImageFileFromBase64 } from '../lib/image.js'

export default function Scanner() {
  const { t } = useTranslation()
  const [connected, setConnected] = useState(false)
  const [mode, setMode] = useState('scan')
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [message, setMessage] = useState(t('scanner.msgConnectPrompt', 'Connect your scanner to begin'))
  const [captured, setCaptured] = useState(false)
  const [matching, setMatching] = useState(false)
  const [matchProgress, setMatchProgress] = useState(0)
  const [results, setResults] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [scanSeed, setScanSeed] = useState(0)
  const [file, setFile] = useState(null)
  const [fileUrl, setFileUrl] = useState('')
  const [matchedImage, setMatchedImage] = useState('')
  const [wsImageSrc, setWsImageSrc] = useState('')
  const [wsMeta, setWsMeta] = useState({ name: '', format: '', size: 0 })
  const [locked, setLocked] = useState(false)
  const acceptTimer = useRef(null)
  const bestRef = useRef(null)
  const lottieRef = useRef(null)
  const lottieInstance = useRef(null)
  const SOCKET_URL = `${location.protocol==='https:'?'wss':'ws'}://100.103.61.128:8765`
  const { status: wsStatus, lastMessage, error: wsError, reconnect: wsReconnect, ws } = useWebSocket(SOCKET_URL)
  

  useEffect(() => {
    return () => {
      if (lottieInstance.current) {
        lottieInstance.current.destroy()
        lottieInstance.current = null
      }
      if (acceptTimer.current) clearTimeout(acceptTimer.current)
      acceptTimer.current = null
      bestRef.current = null
    }
  }, [])

  useEffect(() => {
    setConnected(wsStatus === 'open')
  }, [wsStatus])

  useEffect(() => {
    if (wsStatus !== 'open' || locked || mode !== 'scan') return
    setScanning(true)
    setMessage('Starting scan…')
    const msg = 'start'
    try { if (ws && ws.readyState === 1) ws.send(msg) } catch {}
  }, [wsStatus, ws, locked, mode])

  useEffect(() => {
    if (mode !== 'scan') return
    if (!lastMessage) return
    const raw = String(lastMessage || '')
    const low = raw.trim().toLowerCase()
    let payload = null
    try { const p = JSON.parse(raw); if (p && typeof p === 'object') payload = p } catch {}
    const statusRaw = String(payload?.status || '').trim()
    const statusText = statusRaw.toLowerCase()

    if (low.includes('device opened') || statusText.includes('device opened')) {
      const mode = payload?.mode || payload?.data?.mode || 'Unknown'
      setMessage(`Device opened (${mode})`)
      return
    }

    if (low.includes('waiting for finger') || statusText.includes('waiting for finger')) {
      if (locked) return
      setScanning(true)
      setCaptured(false)
      setMessage('Waiting for finger…')
      return
    }

    if (low.includes('captured') || statusText.includes('captured')) {
      if (locked) return
      setCaptured(true)
      setScanning(false)
      const sz = Number(payload?.data?.image_size ?? payload?.image_size ?? 0) || 0
      if (sz) setWsMeta((m) => ({ ...m, size: sz }))
      setMessage('Captured')
      return
    }

    if (low.includes('image ready') || statusText.includes('image ready')) {
      if (locked) return
      const img = payload?.data?.image ?? payload?.image
      const fmt0 = payload?.data?.image_format ?? payload?.image_format
      const fmt = String(fmt0 || '').toLowerCase() || 'bmp'
      const name0 = payload?.data?.file_name ?? payload?.file_name ?? payload?.filename
      const name = String(name0 || `scan.${fmt || 'bmp'}`)
      const size = Number(payload?.data?.image_size ?? payload?.image_size ?? 0) || 0
      if (img) {
        // show live preview while buffering best candidate
        setWsImageSrc(`data:image/${fmt};base64,${img}`)
        setWsMeta({ name, format: fmt || 'bmp', size })
        if (!acceptTimer.current) {
          bestRef.current = { img, fmt, name, size }
          acceptTimer.current = setTimeout(async () => {
            const c = bestRef.current
            acceptTimer.current = null
            bestRef.current = null
            if (!c) return
              try {
              const f = ensureImageFileFromBase64(c.img, c.fmt, c.name)
              setFile(f)
              setMatchedImage(`data:image/${c.fmt};base64,${c.img}`)
              setCaptured(true)
              setScanning(false)
              setScanProgress(100)
              setLocked(true)
              setMessage(`Image ready (${c.name})`)
              try { if (ws && ws.readyState === 1) ws.send('stop') } catch {}
              startMatching(f)
            } catch {}
          }, 800)
        } else {
          const b = bestRef.current
          if (!b || size > (b.size || 0)) bestRef.current = { img, fmt, name, size }
        }
      }
      return
    }

    if (low.includes('error') || statusText.includes('error')) {
      const err = payload?.error || payload?.data?.error || 'Unknown error'
      setScanning(false)
      setMessage(`Error - ${err}`)
      return
    }
  }, [lastMessage, mode])

  useEffect(() => {
    if (wsError) setMessage(String(wsError))
  }, [wsError])

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

  useEffect(() => {
    if (fileUrl) URL.revokeObjectURL(fileUrl)
    if (file) setFileUrl(URL.createObjectURL(file))
    else setFileUrl('')
    return () => {}
  }, [file])

  const startMatching = async (fileArg = null) => {
    const useFile = fileArg || file
    if (!useFile) return
    setMatching(true)
    setMatchProgress(0)
    setMessage(t('scanner.msgMatching', 'Matching captured fingerprint against database…'))
    setResults([])
    try {
      const res = await matchFingerprint({ file: useFile })
      const toPct = (v) => {
        const n = Number(v)
        if (!Number.isFinite(n)) return 0
        return Math.max(0, Math.min(100, n <= 1 ? Math.round(n * 100) : Math.round(n)))
      }
      const toId = (o) => String(o?.user?.username ?? o?.user?.id ?? o?.id ?? o?.username ?? o?.name ?? 'Unknown')
      const img = res?.image ?? res?.preview ?? res?.reference?.image ?? ''
      if (img) setMatchedImage(img)

      const arr = Array.isArray(res)
        ? res
        : (Array.isArray(res?.results)
            ? res.results
            : (Array.isArray(res?.matches)
                ? res.matches
                : (Array.isArray(res?.candidates)
                    ? res.candidates
                    : null)))

      if (arr) {
        const mapped = arr.map((e) => ({ id: toId(e), score: toPct(e?.certainty ?? e?.score ?? e?.similarity ?? e?.confidence) }))
        mapped.sort((a, b) => b.score - a.score)
        setResults(mapped)
      } else {
        const id = toId(res)
        const score = toPct(res?.certainty ?? res?.score ?? res?.similarity ?? res?.confidence ?? (res?.matched === true ? 100 : 0))
        setResults([{ id, score }])
      }
      setMatchProgress(100)
      setMessage(t('scanner.msgMatchDone', 'Matching complete. Review top candidates by certainty.'))
    } catch (e) {
      try { console.error('match error', e, e?.details) } catch {}
      let detail = e?.details || ''
      try {
        if (detail && detail.trim().startsWith('{')) {
          const j = JSON.parse(detail)
          detail = j?.message || j?.error || detail
        }
      } catch {}
      const status = e?.status ? ` (status ${e.status})` : ''
      const errorMsg = detail ? `${detail}${status}` : t('common.searchFailed', 'Search failed. Please try again.')
      setMessage(`${errorMsg} - If this is a newly enrolled user, they may need to be re-enrolled in demo mode.`)
    } finally {
      setMatching(false)
    }
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
          <div className="flex items-center justify-between">
            <div className="join">
              <button className={`btn btn-sm join-item ${mode==='scan' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => {
                setMode('scan')
                setLocked(false)
                setMessage('Starting scan…')
                try { if (ws && ws.readyState === 1) ws.send('start') } catch {}
                setScanning(true)
              }}>Scan</button>
              <button className={`btn btn-sm join-item ${mode==='upload' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => {
                setMode('upload')
                setLocked(true)
                setScanning(false)
                setMessage('Upload a fingerprint image to match')
                try { if (ws && ws.readyState === 1) ws.send('stop') } catch {}
              }}>Upload</button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-base-content/70">{message}</p>
            <ul className="steps steps-horizontal lg:steps-horizontal text-xs">
              <li className={`step ${connected ? 'step-primary' : ''}`}>{t('scanner.stepConnect')}</li>
              <li className={`step ${captured ? 'step-primary' : scanning ? 'step-secondary' : ''}`}>{t('scanner.stepCapture')}</li>
              <li className={`step ${matchProgress > 0 ? 'step-secondary' : ''} ${!matching && matchProgress===100 ? 'step-primary' : ''}`}>{t('scanner.stepMatch')}</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col items-center gap-4">
              <div className="aspect-[3/4] w-full max-w-xs sm:max-w-sm md:max-w-md rounded-lg border border-base-300 bg-base-200/60 overflow-hidden relative">
                <div ref={lottieRef} className={`absolute inset-0 ${scanning ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center text-base-content/50 text-sm">
                    {wsImageSrc ? (
                      <img src={wsImageSrc} alt="captured" className="h-full w-full object-contain" />
                    ) : fileUrl ? (
                      <img src={fileUrl} alt="captured" className="h-full w-full object-contain" />
                    ) : captured ? 'Fingerprint captured' : 'Scanner preview'}
                  </div>
                )}
              </div>
              {wsImageSrc && (
                <div className="mt-2 w-full text-xs text-base-content/70">
                  <div className="flex items-center gap-3">
                    <span className="badge badge-ghost">{wsMeta.name || 'image'}</span>
                    <span className="badge badge-ghost">{wsMeta.format || 'png'}</span>
                    {wsMeta.size ? <span className="badge badge-ghost">{wsMeta.size} bytes</span> : null}
                  </div>
                </div>
              )}
          {mode==='scan' ? (
            <div className="flex items-center gap-4">
              <div className="text-xs text-base-content/60">{captured ? 'Captured' : 'Waiting for capture…'}</div>
            </div>
          ) : (
            <div className="form-control w-full max-w-xs">
              <div className="label"><span className="label-text">Upload fingerprint</span></div>
              <input type="file" accept="image/*" className="file-input file-input-bordered" onChange={async (e)=>{
                const f = e.target.files?.[0]||null
                setFile(f)
                if (f) {
                  if (fileUrl) URL.revokeObjectURL(fileUrl)
                  setFileUrl(URL.createObjectURL(f))
                  setMatchedImage('')
                  setResults([])
                  setCaptured(true)
                  setMessage('Matching uploaded fingerprint…')
                  await startMatching(f)
                }
              }} />
            </div>
          )}
        </div>
        <div className="space-y-4">
              <div className="rounded-lg border border-base-300 bg-base-200/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-medium">{t('scanner.dbMatching')}</div>
                  <div className="text-xs text-base-content/60">{Math.round(matchProgress)}% complete</div>
                </div>
                <progress className="progress progress-info w-full" value={matchProgress} max="100" />
                
                
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
                    {results.map((r) => (
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
                    {fileUrl ? (
                      <img src={fileUrl} alt="captured" className="h-48 object-contain" />
                    ) : (
                      <FingerprintPreview seed={scanSeed || 12345} width={160} height={200} />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-base-content/60">{t('common.reference')} • {selectedId}</div>
                  <div className="rounded-lg border border-base-300 bg-base-200/60 p-3 flex items-center justify-center">
                    {matchedImage ? (
                      <img src={matchedImage.startsWith('data:') || matchedImage.startsWith('http') ? matchedImage : `data:image/bmp;base64,${matchedImage}`}
                           alt="reference" className="h-48 object-contain" />
                    ) : (
                      <FingerprintPreview seed={hashId(selectedId)} width={160} height={200} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={wsReconnect} disabled={wsStatus==='open' || wsStatus==='connecting'} className="min-w-28">
              {wsStatus==='open' ? t('scanner.connected') : t('scanner.connect')}
            </Button>
            <Button onClick={() => {
              setLocked(false)
              setWsImageSrc('')
              setMatchedImage('')
              setFile(null)
              setFileUrl('')
              setResults([])
              setCaptured(false)
              setMatchProgress(0)
              setMessage('Starting scan…')
              try { if (ws && ws.readyState === 1) ws.send('start') } catch {}
              setScanning(true)
            }} disabled={wsStatus!=='open'} className="min-w-28">
              New Scan
            </Button>
          </div>

          
        </div>
      </div>
    </div>
  )
}

function hashId(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % 1000000000
}

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

 
