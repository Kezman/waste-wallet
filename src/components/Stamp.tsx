import clsx from 'clsx'
import type { Status } from '../lib/types'

const TEXT: Record<Status, string> = {
  open: '',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  expired: 'Истекло',
}

interface StampProps {
  status: Status
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
  className?: string
}

export function Stamp({ status, size = 'md', animate = false, className }: StampProps) {
  if (status === 'open') return null

  return (
    <span
      className={clsx(
        'stamp',
        status === 'approved' && 'stamp--approve',
        status === 'expired' && 'stamp--expired',
        size === 'lg' && 'stamp--lg',
        size === 'sm' && 'stamp--sm',
        animate && 'stamp--anim',
        className,
      )}
    >
      {TEXT[status]}
    </span>
  )
}
