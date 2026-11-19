import { Link, NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useAppStore } from '../lib/store'
import { useTheme } from '../lib/theme'
import { Icon } from './Icon'

const NAV = [
  { to: '/', label: 'Очередь' },
  { to: '/my', label: 'Мои' },
]

export function Header() {
  const guest = useAppStore((state) => state.guest)
  const { theme, toggle } = useTheme()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent2 text-[15px] font-bold text-white shadow-[0_8px_18px_-8px_rgba(79,70,229,0.9)]">
            К
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold tracking-tight sm:text-[13.5px]">
              Кошелёк<span className="hidden sm:inline">, подожди</span>
            </span>
            <span className="hidden truncate text-[11px] text-muted sm:block">
              бюджетный отдел вашей жизни
            </span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 rounded-full bg-surface2 p-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors sm:px-3.5 sm:text-[13px]',
                  isActive ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {guest && (
          <span className="hidden rounded-full bg-surface2 px-2.5 py-1 text-[11px] font-medium text-muted md:inline">
            гость
          </span>
        )}

        <button
          type="button"
          onClick={toggle}
          className="btn btn--icon btn--ghost !h-9 !w-9"
          aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-[18px] w-[18px]" />
        </button>

        <Link to="/new" className="btn btn--primary !h-9">
          <Icon name="plus" className="h-4 w-4" />
          <span className="hidden sm:inline">Заявление</span>
        </Link>
      </div>
    </header>
  )
}
