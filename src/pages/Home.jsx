import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
let lottieHomePromise = null
const getLottieHome = async () => {
  if (!lottieHomePromise) {
    lottieHomePromise = import('lottie-web').then((m) => m.default || m)
  }
  return lottieHomePromise
}
import investigatorAnim from '../assets/Private investigator/animations/edc8c12f-616d-4485-b581-f5e68319729c.json'

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const lottieRef = useRef(null)
  const lottieInstance = useRef(null)

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      if (!lottieRef.current) return
      const lottie = await getLottieHome()
      if (cancelled) return
      if (!lottieInstance.current) {
        lottieInstance.current = lottie.loadAnimation({
          container: lottieRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: investigatorAnim,
        })
      }
    }
    init()
    return () => {
      cancelled = true
      if (lottieInstance.current) {
        lottieInstance.current.destroy()
        lottieInstance.current = null
      }
    }
  }, [])
  return (
    <div className="hero min-h-screen">
      <div className="hero-content flex-col lg:flex-row max-w-6xl mx-auto px-4 py-12 lg:py-20 gap-10 lg:gap-16">
        <div className="w-full max-w-md">
          <div ref={lottieRef} className="w-full aspect-square drop-shadow-xl" />
        </div>
        <div className="max-w-xl">
          <h1 className="text-5xl font-bold leading-tight">{t('home.heroTitle')}</h1>
          <p className="py-6 text-base-content/70">{t('home.heroDesc')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-primary" onClick={() => navigate('/scanner')}>{t('home.openScanner')}</button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <a className="link link-primary" onClick={() => navigate('/enroll')}>{t('home.enrollLink')}</a>
            <span className="text-base-content/40">•</span>
            <a className="link link-primary" onClick={() => navigate('/search')}>{t('home.searchRecords')}</a>
            <span className="text-xs text-base-content/60">{t('home.noDeviceTip')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
