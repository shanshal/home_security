import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
// Lazy-load lottie
let lottie404Promise = null
const getLottie404 = async () => {
  if (!lottie404Promise) {
    lottie404Promise = import('lottie-web').then((m) => m.default || m)
  }
  return lottie404Promise
}
import notFoundAnim from '../assets/404 Not Found(1)/animations/404 Not Found.json'

export default function NotFound() {
  const { t } = useTranslation()
  const lottieRef = useRef(null)
  const lottieInstance = useRef(null)

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      if (!lottieRef.current) return
      const lottie = await getLottie404()
      if (cancelled) return
      if (!lottieInstance.current) {
        lottieInstance.current = lottie.loadAnimation({
          container: lottieRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: notFoundAnim,
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
    <div className="min-h-screen max-w-xl mx-auto text-center flex flex-col items-center justify-center space-y-4 pb-16">
      <div className="mx-auto w-80 h-80 md:w-96 md:h-96">
        <div ref={lottieRef} className="w-full h-full" />
      </div>
      <Link to="/" className="btn btn-primary btn-sm">{t('notFound.back')}</Link>
    </div>
  )
}
