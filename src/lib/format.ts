import type { MoneyRequest, Status, Tally } from './types'

const moneyFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

export function money(value: number): string {
  return `${moneyFormatter.format(Math.round(value))} ₽`
}

export function moneyShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')} млн ₽`
  if (value >= 100_000) return `${Math.round(value / 1000)} тыс ₽`
  return money(value)
}

const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const dayFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

export function clock(iso: string): string {
  return timeFormatter.format(new Date(iso))
}

export function day(iso: string): string {
  return dayFormatter.format(new Date(iso))
}

export function dayTime(iso: string): string {
  return `${dayFormatter.format(new Date(iso))}, ${timeFormatter.format(new Date(iso))}`
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export function remainingLabel(closesAt: string, now: number): string {
  const ms = new Date(closesAt).getTime() - now
  if (ms <= 0) return 'срок истёк'
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const rest = hours % 24
    if (days <= 2 && rest > 0) return `${days} ${plural(days, 'день', 'дня', 'дней')} ${rest} ч`
    return `${days} ${plural(days, 'день', 'дня', 'дней')}`
  }
  if (hours >= 1) return `${hours} ч ${minutes.toString().padStart(2, '0')} мин`
  return `${minutes} мин`
}

export function hoursLeft(closesAt: string, now: number): number {
  return (new Date(closesAt).getTime() - now) / 3_600_000
}

export function tallyOf(votes: MoneyRequest['votes']): Tally {
  const approve = votes.filter((v) => v.decision === 'approve').length
  const reject = votes.filter((v) => v.decision === 'reject').length
  const total = approve + reject
  return { approve, reject, total, approveShare: total === 0 ? 0 : approve / total }
}

export function effectiveStatus(request: MoneyRequest, now: number): Status {
  if (request.status !== 'open') return request.status
  if (now < new Date(request.closesAt).getTime()) return 'open'
  const { approve, reject, total } = tallyOf(request.votes)
  if (total < 3) return 'expired'
  return approve > reject ? 'approved' : 'rejected'
}

export const statusLabel: Record<Status, string> = {
  open: 'на рассмотрении',
  approved: 'одобрено',
  rejected: 'отклонено',
  expired: 'истекло',
}
