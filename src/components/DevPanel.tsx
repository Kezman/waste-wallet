import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '../lib/store'

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
    <div className="no-print fixed bottom-3 right-3 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="sheet w-[260px] p-3 text-[11px]">
          <div className="label mb-2">Демо-панель</div>

          <div className="mb-1 text-ink-soft">
            Сдвиг времени:{' '}
            <span className="num text-ink">
              {offsetHours > 0 ? '+' : ''}
              {offsetHours} ч
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button type="button" className="btn !px-1 !py-1 !text-[9px]" onClick={() => shiftTime(6)}>
              +6 ч
            </button>
            <button type="button" className="btn !px-1 !py-1 !text-[9px]" onClick={() => shiftTime(24)}>
              +24 ч
            </button>
            <button type="button" className="btn !px-1 !py-1 !text-[9px]" onClick={() => shiftTime(72)}>
              +72 ч
            </button>
            <button type="button" className="btn !px-1 !py-1 !text-[9px]" onClick={() => shiftTime(-24)}>
              −24 ч
            </button>
            <button
              type="button"
              className="btn btn--ghost col-span-2 !px-1 !py-1 !text-[9px]"
              onClick={resetTime}
            >
              Сбросить время
            </button>
          </div>

          <div className="perf my-2.5" />

          <label className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-ink-soft">Имитировать сбой сети</span>
            <input
              type="checkbox"
              checked={simulateError}
              onChange={(event) => setSimulateError(event.target.checked)}
              className="accent-stamp"
            />
          </label>
          <label className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-ink-soft">Гостевой режим</span>
            <input
              type="checkbox"
              checked={guest}
              onChange={(event) => setGuest(event.target.checked)}
              className="accent-ink"
            />
          </label>

          <div className="perf my-2.5" />

          <button
            type="button"
            className="btn btn--ghost w-full !text-[9px]"
            onClick={() => {
              resetDemo()
              setOpen(false)
            }}
          >
            Сбросить демо
          </button>
          <p className="mt-2 text-[10px] leading-snug text-ink-soft/80">
            Данные лежат в localStorage браузера. Сброс вернёт исходные 24 заявки.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="btn btn--solid !px-3 !py-2 !text-[10px]"
        aria-expanded={open}
      >
        {open ? 'Закрыть' : '⚙ Демо'}
      </button>
    </div>
  )
}
