import { useEffect, useRef, useState } from 'react'

export function useWebSocket(url, protocols) {
  const [status, setStatus] = useState('idle')
  const [lastMessage, setLastMessage] = useState('')
  const [error, setError] = useState('')
  const wsRef = useRef(null)
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!url) return
    setStatus('connecting')
    setError('')
    const ws = protocols ? new WebSocket(url, protocols) : new WebSocket(url)
    wsRef.current = ws
    ws.onopen = () => setStatus('open')
    ws.onclose = () => setStatus('closed')
    ws.onerror = (e) => { setStatus('error'); setError(String(e?.message || 'error')) }
    ws.onmessage = (ev) => setLastMessage(typeof ev.data === 'string' ? ev.data : '')
    return () => {
      try { ws.close() } catch {}
      wsRef.current = null
    }
  }, [url, n])

  const reconnect = () => setN((x) => x + 1)
  return { status, lastMessage, error, reconnect, ws: wsRef.current }
}
