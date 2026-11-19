import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { RequestCard } from '../components/RequestCard'
import { effectiveStatus, hoursLeft, money } from '../lib/format'
import { decidedCount, savedTotal, useAppStore } from '../lib/store'
import { useNow } from '../lib/useNow'
import type { MoneyRequest } from '../lib/types'

type Filter = 'all' | 'open' | 'soon' | 'decided'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'open', label: 'На рассмотрении' },
  { id: 'soon', label: 'Истекают' },
  { id: 'decided', label: 'Решённые' },
]

function byDeadline(a: MoneyRequest, b: MoneyRequest) {
  return new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime()
}

export default function FeedPage() {
  const requests = useAppStore((state) => state.requests)
  const now = useNow()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const stats = useMemo(
    () => ({
      saved: savedTotal(requests),
      decided: decidedCount(requests),
      votes: requests.reduce((acc, request) => acc + request.votes.length, 0),
    }),
    [requests],
  )

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const filtered = requests.filter((request) => {
      const status = effectiveStatus(request, now)
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'open'
            ? status === 'open'
            : filter === 'soon'
              ? status === 'open' && hoursLeft(request.closesAt, now) < 12
              : status !== 'open'
      if (!matchesFilter) return false
      if (!normalized) return true
      return `${request.title} ${request.reason} ${request.category} ${request.author}`
        .toLowerCase()
        .includes(normalized)
    })

    return filtered.sort((a, b) => {
      const aOpen = effectiveStatus(a, now) === 'open'
      const bOpen = effectiveStatus(b, now) === 'open'
      if (aOpen !== bOpen) return aOpen ? -1 : 1
      if (aOpen) return byDeadline(a, b)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [requests, filter, query, now])

  return (
    <div className="space-y-5">
      <section className="sheet sheet--lift relative overflow-hidden px-5 py-6 sm:px-8 sm:py-7">
        <div className="label">учёт заявок на расход · форма З-1</div>
        <h1 className="doc-title mt-2 text-[26px] leading-[1.1] text-ink sm:text-[38px]">
          Очередь на согласование
        </h1>
        <p className="mt-2.5 max-w-xl font-serif text-[14.5px] leading-relaxed text-ink-soft sm:text-[15.5px]">
          Напишите, что хотите купить, зачем и чем это можно заменить. Через 48 часов незнакомцы вынесут
          решение — а вы успеете передумать.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <div>
            <div className="label">не потрачено</div>
            <div className="num mt-1 text-[19px] font-semibold text-approve sm:text-[22px]">
              {money(stats.saved)}
            </div>
          </div>
          <div>
            <div className="label">заявок рассмотрено</div>
            <div className="num mt-1 text-[19px] font-semibold text-ink sm:text-[22px]">
              {stats.decided}
            </div>
          </div>
          <div>
            <div className="label">заключений подписано</div>
            <div className="num mt-1 text-[19px] font-semibold text-ink sm:text-[22px]">{stats.votes}</div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                data-active={filter === item.id}
                onClick={() => setFilter(item.id)}
                className="chip"
              >
                {item.label}
              </button>
            ))}
            <div className="ml-auto w-full sm:w-56">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по заявкам…"
                className="input !py-1.5 !text-[13px]"
                aria-label="Поиск по заявкам"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="sheet px-5 py-10 text-center">
              <p className="doc-title text-[18px] text-ink">Ничего не найдено</p>
              <p className="mt-1.5 font-serif text-[13.5px] text-ink-soft">
                Под этот фильтр заявок нет. Попробуйте «Все» или подайте своё заявление.
              </p>
              <Link to="/new" className="btn mt-4">
                + Заявление
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {visible.map((request) => (
                <RequestCard key={request.id} request={request} now={now} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="sheet px-4 py-4">
            <div className="label">как это работает</div>
            <ol className="mt-2.5 space-y-2.5">
              {[
                'Пишете заявление: товар, цена, зачем и чем заменить.',
                'Незнакомцы голосуют и обязательно объясняют почему.',
                'Через 48 часов — решение. Покупка ждёт вас, а не наоборот.',
              ].map((text, index) => (
                <li key={text} className="flex gap-2.5">
                  <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink text-[10px] font-semibold">
                    {index + 1}
                  </span>
                  <span className="font-serif text-[12.5px] leading-relaxed text-ink-soft">{text}</span>
                </li>
              ))}
            </ol>
            <Link to="/new" className="btn btn--solid mt-3.5 w-full">
              Подать заявление
            </Link>
          </div>

          <div className="sheet sheet--quiet px-4 py-3.5">
            <div className="label">правило отдела</div>
            <p className="mt-1.5 font-serif text-[12.5px] leading-relaxed text-ink-soft">
              Голос без объяснения не считается. Ценность здесь не в цифре «за», а в чужом аргументе,
              который вы прочитаете до того, как заплатите.
            </p>
          </div>
        </aside>
      </div>

      <div className={clsx('label text-center !text-[10px] text-ink-soft/60')}>
        показано {visible.length} из {requests.length}
      </div>
    </div>
  )
}
