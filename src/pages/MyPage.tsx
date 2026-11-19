import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { RequestCard } from '../components/RequestCard'
import { Icon } from '../components/Icon'
import { effectiveStatus, money } from '../lib/format'
import { useAppStore } from '../lib/store'
import { useNow } from '../lib/useNow'

export default function MyPage() {
  const all = useAppStore((state) => state.requests)
  const now = useNow()

  const mine = useMemo(() => all.filter((request) => request.mine), [all])

  const stats = useMemo(() => {
    const saved = mine.reduce(
      (acc, request) =>
        request.status === 'rejected' || request.outcome === 'resisted' ? acc + request.price : acc,
      0,
    )
    const pending = mine.filter((request) => effectiveStatus(request, now) === 'open').length
    return { saved, pending }
  }, [mine, now])

  return (
    <div className="space-y-5">
      <section className="card p-5 sm:p-7">
        <div>
          <div className="label">личное дело</div>
          <h1 className="mt-1 text-[24px] font-bold tracking-tight sm:text-[30px]">Мои заявления</h1>
          <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-muted">
            Здесь видно, сколько просьб вы отправили в отдел и сколько денег он помог сохранить.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <div className="rounded-xl bg-surface2 px-3.5 py-3">
            <div className="label">всего</div>
            <div className="num mt-1 text-[19px] font-bold">{mine.length}</div>
          </div>
          <div className="rounded-xl bg-surface2 px-3.5 py-3">
            <div className="label">в работе</div>
            <div className="num mt-1 text-[19px] font-bold">{stats.pending}</div>
          </div>
          <div className="rounded-xl bg-surface2 px-3.5 py-3">
            <div className="label">сэкономлено</div>
            <div className="num mt-1 text-[19px] font-bold text-ok">{money(stats.saved)}</div>
          </div>
        </div>
      </section>

      {mine.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-surface2">
            <Icon name="wallet" className="h-5 w-5 text-muted" />
          </span>
          <p className="mt-3 text-[16px] font-semibold">Пока пусто</p>
          <p className="mt-1 max-w-xs text-[13px] text-muted">
            Первое заявление обычно самое трудное — и самое полезное.
          </p>
          <Link to="/new" className="btn btn--primary mt-4">
            Подать заявление
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {mine.map((request) => (
            <RequestCard key={request.id} request={request} now={now} />
          ))}
        </div>
      )}
    </div>
  )
}
