import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

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
  const current = i18n.resolvedLanguage || i18n.language
  const toggleLang = () => {
    const next = current === 'en' ? 'ar' : 'en'
    i18n.changeLanguage(next)
    // apply direction + font
    const html = document.documentElement
    html.setAttribute('lang', next)
    html.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr')
    html.classList.toggle('font-arabic', next === 'ar')
  }
  return (
    <div className="flex h-full flex-col">
      {/* Brand / Header */}
      <div className="flex items-center gap-3 p-4 border-b border-base-300">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary" aria-hidden />
          <span className="text-base font-semibold">{t('home.title')}</span>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="menu px-3 py-2 gap-1">
          <li className="menu-title"><span>{t('menu.overview')}</span></li>
          <LinkItem to="/">{t('nav.home')}</LinkItem>
          <LinkItem to="/scanner">{t('nav.scanner')}</LinkItem>

          <li className="menu-title mt-2"><span>{t('menu.users')}</span></li>
          <LinkItem to="/enroll">{t('nav.enroll')}</LinkItem>
          <LinkItem to="/search">{t('nav.search')}</LinkItem>

          <li className="menu-title mt-2"><span>{t('menu.support')}</span></li>
          <LinkItem to="/about">{t('nav.about')}</LinkItem>
        </ul>
      </nav>

      {/* Footer actions */}
      <div className="p-4 border-t border-base-300">
        <button onClick={toggleLang} className="btn btn-ghost btn-sm w-full">
          {current === 'en' ? 'AR' : 'EN'}
        </button>
        <div className="mt-2 text-xs text-base-content/60">{t('dashboard.label')}</div>
      </div>
    </div>
  )
}
