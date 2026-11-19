import clsx from 'clsx'
import { tallyOf } from '../lib/format'
import type { MoneyRequest } from '../lib/types'

interface TallyBarProps {
  request: MoneyRequest
  showCounts?: boolean
  className?: string
}

export function TallyBar({ request, showCounts = true, className }: TallyBarProps) {
  const tally = tallyOf(request.votes)
  const approveWidth = tally.total === 0 ? 0 : Math.round(tally.approveShare * 100)

  return (
    <div className={className}>
      <div className="tally" role="img" aria-label={`За покупку ${tally.approve}, против ${tally.reject}`}>
        <div className="tally__approve" style={{ width: `${approveWidth}%` }} />
        <div className="tally__reject" style={{ width: `${100 - approveWidth}%` }} />
      </div>
      {showCounts && (
        <div className="mt-1.5 flex items-center justify-between text-[11px]">
          <span className={clsx('num', tally.approve > 0 ? 'text-approve' : 'text-ink-soft/60')}>
            ▲ {tally.approve} за
          </span>
          <span className={clsx('num', tally.reject > 0 ? 'text-stamp' : 'text-ink-soft/60')}>
            ▼ {tally.reject} против
          </span>
        </div>
      )}
    </div>
  )
}
