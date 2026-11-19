import clsx from 'clsx'
import type { Status } from '../lib/types'

const MAP: Record<Status, { text: string; tone: string }> = {
  open: { text: 'На рассмотрении', tone: 'badge--neutral' },
  approved: { text: 'Одобрено', tone: 'badge--ok' },
  rejected: { text: 'Отклонено', tone: 'badge--bad' },
  expired: { text: 'Истекло', tone: 'badge--warn' },
}

interface StampProps {
  status: Status
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
  className?: string
}

export function Stamp({ status, size = 'md', animate = false, className }: StampProps) {
  if (status === 'open') return null
  const item = MAP[status]

  return (
    <span
      className={clsx(
        'badge',
        item.tone,
        size === 'lg' && 'badge--lg',
        size === 'sm' && '!h-6 !text-[11px]',
        animate && 'pop',
        className,
      )}
    >
      <span className="badge__dot" />
      {item.text}
    </span>
  )
}
