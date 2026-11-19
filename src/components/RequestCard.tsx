import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Stamp } from './Stamp'
import { TallyBar } from './TallyBar'
import { Icon } from './Icon'
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
    <Link to={`/request/${request.id}`} className="card card--hover block p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mono rounded-md bg-surface2 px-1.5 py-0.5 text-[10.5px] text-muted">
              {request.code}
            </span>
            <span className="rounded-md bg-surface2 px-1.5 py-0.5 text-[10.5px] font-medium text-muted">
              {request.category}
            </span>
            {request.mine && (
              <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-accent">
                моя
              </span>
            )}
          </div>
          <h3 className="mt-2 text-[16.5px] font-semibold leading-snug tracking-tight sm:text-[17.5px]">
            {request.title}
          </h3>
        </div>

        <div className="shrink-0 text-right">
          <div className="num text-[16px] font-bold sm:text-[17.5px]">{money(request.price)}</div>
          <div className="mt-1 text-[11px] text-muted">
            {status === 'open'
              ? 'ждёт решения'
              : `${tally.total} ${tally.total === 1 ? 'голос' : 'голосов'}`}
          </div>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">{request.reason}</p>

      <div className="mt-3.5 flex items-end gap-3">
        <TallyBar request={request} className="min-w-0 flex-1" />

        <div className="flex shrink-0 items-center">
          {status === 'open' ? (
            <span
              className={clsx(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium',
                soon ? 'bg-badsoft text-bad' : 'bg-surface2 text-muted',
              )}
            >
              <Icon name="clock" className="h-3 w-3" />
              {remainingLabel(request.closesAt, now)}
            </span>
          ) : (
            <Stamp status={status} />
          )}
        </div>
      </div>
    </Link>
  )
}
