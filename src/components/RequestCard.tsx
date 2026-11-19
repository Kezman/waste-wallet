import { Link } from 'react-router-dom'
import { Stamp } from './Stamp'
import { TallyBar } from './TallyBar'
import { effectiveStatus, hoursLeft, money, remainingLabel, tallyOf } from '../lib/format'
import type { MoneyRequest } from '../lib/types'

interface RequestCardProps {
  request: MoneyRequest
  now: number
}

export function RequestCard({ request, now }: RequestCardProps) {
  const status = effectiveStatus(request, now)
  const tally = tallyOf(request.votes)
  const soon = status === 'open' && hoursLeft(request.closesAt, now) < 12

  return (
    <Link
      to={`/request/${request.id}`}
      className="sheet group relative block px-4 py-4 transition-transform duration-150 hover:-translate-y-[1px] hover:shadow-[3px_3px_0_rgba(74,60,40,0.1),0_26px_50px_-32px_rgba(74,60,40,0.9)] sm:px-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="num text-[10px] tracking-[0.08em] text-ink-soft">{request.code}</span>
            <span className="tag">{request.category}</span>
            {request.mine && <span className="tag !border-ink/40 !text-ink">моя</span>}
          </div>
          <h3 className="doc-title mt-1.5 text-[18px] leading-snug text-ink sm:text-[19px]">
            {request.title}
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <div className="num text-[17px] font-semibold leading-none text-ink sm:text-[19px]">
            {money(request.price)}
          </div>
          <div className="label mt-1.5 text-[9.5px]">
            {status === 'open' ? 'на рассмотрении' : `${tally.total} голосов`}
          </div>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 font-serif text-[13.5px] leading-relaxed text-ink-soft">
        {request.reason}
      </p>

      <div className="mt-3 flex items-end gap-3">
        <TallyBar request={request} className="min-w-0 flex-1" />
        <div className="flex shrink-0 items-center gap-2">
          {status === 'open' ? (
            <span
              className={
                soon
                  ? 'text-[11px] font-semibold uppercase tracking-[0.08em] text-stamp'
                  : 'text-[11px] uppercase tracking-[0.08em] text-ink-soft'
              }
            >
              {soon ? '⏳ ' : ''}
              {remainingLabel(request.closesAt, now)}
            </span>
          ) : (
            <Stamp status={status} size="sm" />
          )}
        </div>
      </div>
    </Link>
  )
}
