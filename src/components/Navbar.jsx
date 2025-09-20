import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'

function LinkItem({ to, children }) {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ` +
          (isActive ? 'active' : 'hover:bg-base-200')
        }
        end
      >
        <span className="font-medium">{children}</span>
      </NavLink>
    </li>
  )
}

export default function Navbar() {
  const { i18n, t } = useTranslation()
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || (document.documentElement.getAttribute('data-theme') || 'nord') } catch { return 'nord' }
  })
  const current = i18n.resolvedLanguage || i18n.language
  const toggleLang = () => {
    const next = current === 'en' ? 'ar' : 'en'
    i18n.changeLanguage(next)
    const html = document.documentElement
    html.setAttribute('lang', next)
    html.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr')
    html.classList.toggle('font-arabic', next === 'ar')
  }
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch {}
  }, [theme])
  const toggleTheme = () => {
    setTheme((t0) => (t0 === 'nord' ? 'dracula' : 'nord'))
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-base-300">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary" aria-hidden />
          <span className="text-base font-semibold">{t('home.title')}</span>
        </NavLink>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="menu px-3 py-3 gap-1">
          <LinkItem to="/">{t('nav.home')}</LinkItem>
          <LinkItem to="/scanner">{t('nav.scanner')}</LinkItem>
          <LinkItem to="/enroll">{t('nav.enroll')}</LinkItem>
          <LinkItem to="/search">{t('nav.search')}</LinkItem>
          <LinkItem to="/security">{t('nav.security', 'Security')}</LinkItem>
        </ul>
      </nav>

      <div className="p-4 border-t border-base-300">
        <button onClick={toggleTheme} className="btn btn-ghost btn-sm w-full mb-2">
          {theme === 'nord' ? 'Dracula' : 'Nord'}
        </button>
        <button onClick={toggleLang} className="btn btn-ghost btn-sm w-full">
          {current === 'en' ? 'AR' : 'EN'}
        </button>
      </div>
    </div>
  )
}
