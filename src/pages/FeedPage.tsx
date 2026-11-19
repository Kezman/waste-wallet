import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RequestCard } from '../components/RequestCard'
import { Icon } from '../components/Icon'
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

const STEPS = [
  'Пишете заявление: товар, цена, зачем и чем заменить.',
  'Незнакомцы голосуют и обязательно объясняют почему.',
  'Через 48 часов — решение. Покупка ждёт вас, а не наоборот.',
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
      <section className="card relative overflow-hidden p-5 sm:p-8">
        <div className="glow absolute -right-16 -top-24 h-44 w-44 bg-accent/70" />
        <div className="glow absolute -bottom-28 left-1/4 h-40 w-40 bg-accent2/60" />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">
            <Icon name="sparkle" className="h-3.5 w-3.5 text-accent" />
            48 часов на размышление
          </span>

          <h1 className="mt-3 text-[27px] font-bold leading-[1.08] tracking-tight sm:text-[38px]">
            Очередь на согласование
          </h1>
          <p className="mt-2.5 max-w-xl text-[14px] leading-relaxed text-muted sm:text-[15px]">
            Напишите, что хотите купить, зачем и чем это можно заменить. Через двое суток незнакомцы
            вынесут решение — а вы успеете передумать.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <div className="rounded-xl bg-surface2 px-3.5 py-3">
              <div className="label">не потрачено</div>
              <div className="num mt-1 text-[19px] font-bold text-ok sm:text-[22px]">
                {money(stats.saved)}
              </div>
            </div>
            <div className="rounded-xl bg-surface2 px-3.5 py-3">
              <div className="label">рассмотрено</div>
              <div className="num mt-1 text-[19px] font-bold sm:text-[22px]">{stats.decided}</div>
            </div>
            <div className="col-span-2 rounded-xl bg-surface2 px-3.5 py-3 sm:col-span-1">
              <div className="label">заключений</div>
              <div className="num mt-1 text-[19px] font-bold sm:text-[22px]">{stats.votes}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_286px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
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
            </div>

            <div className="relative ml-auto w-full sm:w-60">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по заявкам"
                className="input !h-9 !pl-9 !text-[13px]"
                aria-label="Поиск по заявкам"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="card flex flex-col items-center px-6 py-14 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-surface2">
                <Icon name="search" className="h-5 w-5 text-muted" />
              </span>
              <p className="mt-3 text-[16px] font-semibold">Ничего не найдено</p>
              <p className="mt-1 max-w-xs text-[13px] text-muted">
                Под этот фильтр заявок нет. Попробуйте «Все» или подайте своё заявление.
              </p>
              <Link to="/new" className="btn btn--primary mt-4">
                <Icon name="plus" className="h-4 w-4" />
                Заявление
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {visible.map((request) => (
                <RequestCard key={request.id} request={request} now={now} />
              ))}
            </div>
          )}

          <p className="pt-1 text-center text-[11px] text-muted">
            показано {visible.length} из {requests.length}
          </p>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-4">
            <div className="label">как это работает</div>
            <ol className="mt-3 space-y-3">
              {STEPS.map((text, index) => (
                <li key={text} className="flex gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/10 text-[10.5px] font-bold text-accent">
                    {index + 1}
                  </span>
                  <span className="text-[12.5px] leading-relaxed text-muted">{text}</span>
                </li>
              ))}
            </ol>
            <Link to="/new" className="btn btn--primary mt-3.5 w-full">
              Подать заявление
            </Link>
          </div>

          <div className="card card--quiet p-4">
            <div className="label">правило отдела</div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
              Голос без объяснения не считается. Ценность здесь не в цифре «за», а в чужом аргументе,
              который вы прочитаете до того, как заплатите.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
