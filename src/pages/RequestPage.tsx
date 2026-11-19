import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { Stamp } from '../components/Stamp'
import { TallyBar } from '../components/TallyBar'
import { VoteForm } from '../components/VoteForm'
import { dayTime, effectiveStatus, money, remainingLabel, tallyOf } from '../lib/format'
import { CURRENT_USER } from '../lib/seed'
import { useAppStore } from '../lib/store'
import { useNow } from '../lib/useNow'
import type { MoneyRequest, Outcome, Status, Vote } from '../lib/types'

const VERDICT_TEXT: Record<Exclude<Status, 'open'>, string> = {
  approved:
    'Большинство согласующих поддержало покупку. Это не запрет на размышления — просто теперь вы знаете, что не один так думаете.',
  rejected:
    'Сообщество против. Заявка закрыта, деньги остались у вас — а аргументы остались в документе.',
  expired:
    'За отведённое время не набралось трёх заключений. Покупка не согласована, но и не запрещена — решайте сами.',
}

function VoteItem({ vote, mine }: { vote: Vote; mine: boolean }) {
  const approve = vote.decision === 'approve'
  return (
    <li
      className={clsx(
        'border-l-2 pl-3',
        approve ? 'border-approve' : 'border-stamp',
        mine && 'bg-ink/[0.03]',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="text-[12.5px] font-semibold text-ink">{vote.author}</span>
        <span className="label !text-[8.5px]">карма {vote.karma}</span>
        <span
          className={clsx(
            'label !text-[8.5px]',
            approve ? 'text-approve' : 'text-stamp',
          )}
        >
          {approve ? 'за покупку' : 'против'}
        </span>
        {mine && <span className="label !text-[8.5px] !text-ink">ваш голос</span>}
        <span className="num ml-auto text-[10px] text-ink-soft/70">{dayTime(vote.createdAt)}</span>
      </div>
      <p className="mt-1 font-serif text-[13.5px] leading-relaxed text-ink">{vote.text}</p>
    </li>
  )
}

function OutcomeBlock({ request }: { request: MoneyRequest }) {
  const setOutcome = useAppStore((state) => state.setOutcome)
  const [busy, setBusy] = useState(false)

  const choose = async (outcome: Outcome) => {
    setBusy(true)
    try {
      await setOutcome(request.id, outcome)
    } finally {
      setBusy(false)
    }
  }

  if (request.outcome) {
    return (
      <div className="mt-3 border border-rule bg-sheet/60 px-3 py-2.5">
        <div className="label">ваш итог</div>
        <p className="mt-1 font-serif text-[13px]">
          {request.outcome === 'resisted'
            ? `Не купил. ${money(request.price)} остались на счёте.`
            : 'Купил. Значит, аргументы сообщества оказались слабее ваших.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-3">
      <div className="label">что в итоге?</div>
      <div className="mt-1.5 flex gap-2">
        <button type="button" className="btn btn--wide" disabled={busy} onClick={() => choose('bought')}>
          Купил
        </button>
        <button
          type="button"
          className="btn btn--wide !border-approve !text-approve"
          disabled={busy}
          onClick={() => choose('resisted')}
        >
          Удержался
        </button>
      </div>
    </div>
  )
}

export default function RequestPage() {
  const { id } = useParams<{ id: string }>()
  const request = useAppStore((state) => state.requests.find((item) => item.id === id))
  const guest = useAppStore((state) => state.guest)
  const setGuest = useAppStore((state) => state.setGuest)
  const now = useNow()
  const [params] = useSearchParams()
  const [copied, setCopied] = useState(false)

  if (!request) {
    return (
      <div className="sheet px-6 py-12 text-center">
        <div className="label">ошибка · 404</div>
        <h1 className="doc-title mt-2 text-[24px]">Заявление не найдено</h1>
        <p className="mt-2 font-serif text-[14px] text-ink-soft">
          Возможно, его отозвали или ссылка устарела.
        </p>
        <Link to="/" className="btn mt-5">
          К очереди
        </Link>
      </div>
    )
  }

  const status = effectiveStatus(request, now)
  const tally = tallyOf(request.votes)
  const myVote = request.votes.find((vote) => vote.author === CURRENT_USER.name)
  const isAuthor = request.mine
  const isOpen = status === 'open'
  const emailDemo = params.get('demo') !== null

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft hover:text-ink">
          ← К очереди
        </Link>
        <button
          type="button"
          onClick={copyLink}
          className="text-[11px] uppercase tracking-[0.1em] text-ink-soft hover:text-ink link-underline"
        >
          {copied ? 'ссылка скопирована' : 'скопировать ссылку'}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="sheet relative px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="label">заявление на расход · {request.code}</div>
              <div className="num mt-1 text-[10.5px] text-ink-soft/80">
                подано {dayTime(request.createdAt)}
              </div>
            </div>
            {status !== 'open' && <Stamp status={status} animate />}
          </div>

          <h1 className="doc-title mt-3 text-[24px] leading-tight text-ink sm:text-[30px]">
            {request.title}
          </h1>

          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-rule py-4 sm:grid-cols-4">
            <div>
              <div className="label">сумма</div>
              <div className="num mt-1 text-[18px] font-semibold text-ink sm:text-[20px]">
                {money(request.price)}
              </div>
            </div>
            <div>
              <div className="label">категория</div>
              <div className="mt-1.5">
                <span className="tag">{request.category}</span>
              </div>
            </div>
            <div>
              <div className="label">заявитель</div>
              <div className="mt-1 text-[13px] font-semibold text-ink">
                {isAuthor ? 'Вы' : request.author}
              </div>
              <div className="label !text-[8.5px]">карма {request.authorKarma}</div>
            </div>
            <div>
              <div className="label">{isOpen ? 'осталось' : 'статус'}</div>
              <div
                className={clsx(
                  'num mt-1 text-[13px] font-semibold',
                  isOpen ? 'text-ink' : 'text-ink-soft',
                )}
              >
                {isOpen ? remainingLabel(request.closesAt, now) : `срок ${dayTime(request.closesAt)}`}
              </div>
            </div>
          </div>

          <section className="mt-5">
            <h2 className="label label--ink">обоснование</h2>
            <p className="mt-2 font-serif text-[15px] leading-[1.75] text-ink">{request.reason}</p>
          </section>

          <section className="mt-5">
            <h2 className="label label--ink">альтернатива</h2>
            <p className="mt-2 font-serif text-[15px] leading-[1.75] text-ink-soft">
              {request.alternative}
            </p>
          </section>

          <div className="perf mt-6 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <h2 className="label label--ink">заключения согласующих · {tally.total}</h2>
              <TallyBar request={request} showCounts={false} className="w-28" />
            </div>

            {request.votes.length === 0 ? (
              <p className="mt-3 font-serif text-[13.5px] italic text-ink-soft">
                Пока никто не высказался. Первое заключение обычно задаёт тон всему делу.
              </p>
            ) : (
              <ul className="mt-3 space-y-3.5">
                {request.votes
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((vote) => (
                    <VoteItem key={vote.id} vote={vote} mine={vote.author === CURRENT_USER.name} />
                  ))}
              </ul>
            )}
          </div>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {isOpen ? (
            <div className="sheet px-4 py-4">
              <div className="label">голосование</div>
              <div className="mt-2.5">
                <TallyBar request={request} />
              </div>

              <div className="mt-4">
                {isAuthor ? (
                  <p className="border-l-2 border-rule pl-2.5 font-serif text-[12.5px] leading-relaxed text-ink-soft">
                    Вы заявитель: голосовать за собственную покупку нельзя. Зато можно позвать людей —
                    кнопка «скопировать ссылку» выше.
                  </p>
                ) : myVote ? (
                  <div>
                    <div className="label">ваше заключение подписано</div>
                    <p className="mt-1.5 font-serif text-[13px] leading-relaxed text-ink">
                      {myVote.text}
                    </p>
                    <div className="label mt-2 !text-[9px] text-ink-soft/70">
                      {myVote.decision === 'approve' ? 'вы за покупку' : 'вы против покупки'}
                    </div>
                  </div>
                ) : guest ? (
                  <div className="space-y-2">
                    <p className="font-serif text-[12.5px] leading-relaxed text-ink-soft">
                      Гостевой режим: смотреть можно, голосовать — нет.
                    </p>
                    <button type="button" className="btn w-full" onClick={() => setGuest(false)}>
                      Вернуться в отдел
                    </button>
                  </div>
                ) : (
                  <VoteForm requestId={request.id} />
                )}
              </div>
            </div>
          ) : (
            <div className="sheet px-4 py-5">
              <div className="label">решение отдела</div>
              <div className="mt-3 flex justify-center">
                <Stamp status={status} size="lg" animate />
              </div>
              <div className="mt-4">
                <TallyBar request={request} />
              </div>
              <p className="mt-3 font-serif text-[12.5px] leading-relaxed text-ink-soft">
                {VERDICT_TEXT[status]}
              </p>
              {isAuthor && <OutcomeBlock request={request} />}
            </div>
          )}

          {emailDemo && (
            <div className="sheet sheet--quiet px-3.5 py-2.5">
              <div className="label">демонстрационный режим</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
                Это прототип без сервера: заявки и голоса живут в вашем браузере.
              </p>
            </div>
          )}

          {isOpen && !guest && !myVote && !isAuthor && (
            <div className="sheet sheet--quiet px-3.5 py-2.5">
              <div className="label">срок рассмотрения</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
                Заявка закроется автоматически через {remainingLabel(request.closesAt, now)}. После этого
                голоса не принимаются.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
