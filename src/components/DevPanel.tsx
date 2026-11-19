import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { useAppStore } from '../lib/store'
import { Icon } from './Icon'

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5">
      <span className="text-[12px] text-muted">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-line',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  )
}

export function DevPanel() {
  const [params] = useSearchParams()
  const enabled = params.get('dev') === '1'
  const [open, setOpen] = useState(false)

  const timeOffsetMs = useAppStore((state) => state.timeOffsetMs)
  const simulateError = useAppStore((state) => state.simulateError)
  const guest = useAppStore((state) => state.guest)
  const shiftTime = useAppStore((state) => state.shiftTime)
  const resetTime = useAppStore((state) => state.resetTime)
  const resetDemo = useAppStore((state) => state.resetDemo)
  const setSimulateError = useAppStore((state) => state.setSimulateError)
  const setGuest = useAppStore((state) => state.setGuest)

  if (!enabled) return null

  const offsetHours = Math.round(timeOffsetMs / 3_600_000)

  return (
    <div className="no-print fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="card rise w-[276px] p-4">
          <div className="flex items-center justify-between">
            <span className="label">Демо-панель</span>
            <span className="mono text-[11px] text-muted">
              {offsetHours > 0 ? '+' : ''}
              {offsetHours} ч
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            {[
              { label: '+6', value: 6 },
              { label: '+24', value: 24 },
              { label: '+72', value: 72 },
              { label: '−24', value: -24 },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => shiftTime(item.value)}
                className="rounded-lg bg-surface2 py-1.5 text-[11.5px] font-semibold text-muted transition-colors hover:text-ink"
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={resetTime}
            className="mt-1.5 w-full rounded-lg bg-surface2 py-1.5 text-[11.5px] font-medium text-muted transition-colors hover:text-ink"
          >
            Сбросить время
          </button>

          <div className="divider my-3" />

          <ToggleRow label="Сбой сети" checked={simulateError} onChange={setSimulateError} />
          <ToggleRow label="Гостевой режим" checked={guest} onChange={setGuest} />

          <div className="divider my-3" />

          <button
            type="button"
            onClick={() => {
              resetDemo()
              setOpen(false)
            }}
            className="btn btn--sm w-full"
          >
            <Icon name="refresh" className="h-3.5 w-3.5" />
            Сбросить демо
          </button>
          <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
            Данные хранятся в localStorage браузера. Сброс вернёт исходные 24 заявки.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="btn btn--primary !h-11 !w-11 !rounded-full !p-0 shadow-lg"
        aria-expanded={open}
        aria-label="Демо-панель"
        title="Демо-панель"
      >
        <Icon name="sliders" className="h-5 w-5" />
      </button>
    </div>
  )
}
