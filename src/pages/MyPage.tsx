import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { RequestCard } from '../components/RequestCard'
import { effectiveStatus, money } from '../lib/format'
import { useAppStore } from '../lib/store'
import { useNow } from '../lib/useNow'

export default function MyPage() {
  const all = useAppStore((state) => state.requests)
  const now = useNow()

  const mine = useMemo(() => all.filter((request) => request.mine), [all])

  const stats = useMemo(() => {
    const rejected = mine.filter((request) => request.status === 'rejected').length
    const saved = mine.reduce(
      (acc, request) =>
        request.status === 'rejected' || request.outcome === 'resisted' ? acc + request.price : acc,
      0,
    )
    const pending = mine.filter((request) => effectiveStatus(request, now) === 'open').length
    return { rejected, saved, pending }
  }, [mine, now])

  return (
    <div className="space-y-5">
      <section className="sheet px-5 py-5 sm:px-7">
        <div className="label">личное дело</div>
        <h1 className="doc-title mt-1.5 text-[24px] text-ink sm:text-[30px]">Мои заявления</h1>
        <p className="mt-1.5 max-w-lg font-serif text-[13.5px] leading-relaxed text-ink-soft">
          Здесь видно, сколько просьб вы отправили в отдел и сколько денег отдел помог вам сохранить.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-rule pt-4">
          <div>
            <div className="label">всего</div>
            <div className="num mt-1 text-[19px] font-semibold text-ink">{mine.length}</div>
          </div>
          <div>
            <div className="label">на рассмотрении</div>
            <div className="num mt-1 text-[19px] font-semibold text-ink">{stats.pending}</div>
          </div>
          <div>
            <div className="label">сэкономлено</div>
            <div className="num mt-1 text-[19px] font-semibold text-approve">{money(stats.saved)}</div>
          </div>
        </div>
      </section>

      {mine.length === 0 ? (
        <div className="sheet px-5 py-10 text-center">
          <p className="doc-title text-[18px]">Пока пусто</p>
          <p className="mt-1.5 font-serif text-[13.5px] text-ink-soft">
            Первое заявление обычно самое трудное — и самое полезное.
          </p>
          <Link to="/new" className="btn btn--solid mt-4">
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
