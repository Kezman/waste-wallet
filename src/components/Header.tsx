import { Link, NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useAppStore } from '../lib/store'

const NAV = [
  { to: '/', label: 'Очередь' },
  { to: '/my', label: 'Мои' },
]

export function Header() {
  const guest = useAppStore((state) => state.guest)

  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink/80 bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <span className="emblem !h-[1.9rem] !w-[1.9rem] !text-[0.8rem] sm:!h-[2.35rem] sm:!w-[2.35rem] sm:!text-[1.05rem]">
            К
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-extrabold uppercase tracking-[0.13em] text-ink sm:text-[12.5px] sm:tracking-[0.2em]">
              Кошелёк, подожди
            </span>
            <span className="hidden truncate font-serif text-[11px] italic text-ink-soft sm:block">
              бюджетный отдел вашей жизни
            </span>
          </span>
        </Link>

        <nav className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'whitespace-nowrap rounded-[2px] px-1.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors sm:px-2.5 sm:text-[12px] sm:tracking-[0.12em]',
                  isActive ? 'bg-ink text-sheet' : 'text-ink-soft hover:text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/new"
            className="btn ml-0.5 !px-2 !py-1.5 !text-[10px] sm:ml-1 sm:!px-3.5 sm:!text-[11px]"
            aria-label="Новое заявление"
          >
            <span className="text-[14px] leading-none">+</span>
            <span className="hidden sm:inline">Заявление</span>
          </Link>
          {guest && (
            <span className="ml-1 hidden rounded-[2px] border border-rule px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-ink-soft md:inline">
              гостевой режим
            </span>
          )}
        </nav>
      </div>
    </header>
  )
}
