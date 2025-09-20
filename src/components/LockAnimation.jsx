import { useEffect, useRef } from 'react'
import animData from '../assets/Lock/animations/167c3f45-295c-4a19-95a2-658f3fd52b2c.json'

let lottiePromise = null
const getLottie = async () => {
  if (!lottiePromise) lottiePromise = import('lottie-web').then((m)=>m.default||m)
  return lottiePromise
}

export default function LockAnimation({ state = 'idle', size = 96, lockedFrame = 65, unlockedFrame = 1, onComplete }) {
  const ref = useRef(null)
  const inst = useRef(null)
  const completeRef = useRef(null)
  const pendingRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      const lottie = await getLottie()
      if (cancelled || !ref.current) return
      if (!inst.current) {
        inst.current = lottie.loadAnimation({
          container: ref.current,
          renderer: 'svg',
          rendererSettings: { progressiveLoad: true, preserveAspectRatio: 'xMidYMid slice' },
          loop: false,
          autoplay: false,
          animationData: animData,
        })
        completeRef.current = () => { onComplete && onComplete() }
        inst.current.addEventListener('complete', completeRef.current)
        const initial = pendingRef.current || state
        if (initial === 'locked-stop') inst.current.goToAndStop(lockedFrame, true)
        else if (initial === 'unlocked-stop') inst.current.goToAndStop(unlockedFrame, true)
        else if (initial === 'lock') {
          inst.current.setDirection(1)
          inst.current.playSegments([unlockedFrame, lockedFrame], true)
        } else if (initial === 'unlock') {
          inst.current.setDirection(-1)
          inst.current.playSegments([unlockedFrame, lockedFrame], true)
        }
      }
    }
    init()
    return () => {
      cancelled = true
      if (inst.current) {
        if (completeRef.current) inst.current.removeEventListener('complete', completeRef.current)
        inst.current.destroy()
        inst.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!inst.current) {
      pendingRef.current = state
      return
    }
    if (state === 'lock') {
      inst.current.setDirection(1)
      inst.current.playSegments([unlockedFrame, lockedFrame], true)
    } else if (state === 'unlock') {
      inst.current.setDirection(1)
      inst.current.playSegments([lockedFrame, unlockedFrame], true)
    } else if (state === 'locked-stop') {
      inst.current.goToAndStop(lockedFrame, true)
    } else if (state === 'unlocked-stop') {
      inst.current.goToAndStop(unlockedFrame, true)
    }
  }, [state, lockedFrame, unlockedFrame])

  useEffect(() => {
    if (!inst.current) return
    if (completeRef.current) inst.current.removeEventListener('complete', completeRef.current)
    completeRef.current = () => { onComplete && onComplete() }
    inst.current.addEventListener('complete', completeRef.current)
  }, [onComplete])

  return (
    <div style={{ width: size, height: size }} className="select-none" ref={ref} />
  )
}
