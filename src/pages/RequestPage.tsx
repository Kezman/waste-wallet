import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { Stamp } from '../components/Stamp'
import { TallyBar } from '../components/TallyBar'
import { VoteForm } from '../components/VoteForm'
import { Icon } from '../components/Icon'
import { dayTime, effectiveStatus, money, remainingLabel, tallyOf } from '../lib/format'
import { CURRENT_USER } from '../lib/seed'
import { useAppStore } from '../lib/store'
import { useNow } from '../lib/useNow'
import type { MoneyRequest, Outcome, Status, Vote } from '../lib/types'

const VERDICT_TEXT: Record<Exclude<Status, 'open'>, string> = {
  approved:
    'Большинство поддержало покупку. Это не запрет на размышления — просто теперь вы знаете, что не один так думаете.',
  rejected:
    'Сообщество против. Заявка закрыта, деньги остались у вас — а аргументы остались в документе.',
  expired: 'За отведённое время не набралось трёх заключений. Покупка не согласована, но и не запрещена.',
}

const VERDICT_ICON: Record<Exclude<Status, 'open'>, 'check' | 'x' | 'clock'> = {
  approved: 'check',
  rejected: 'x',
  expired: 'clock',
}

const VERDICT_STYLE: Record<Exclude<Status, 'open'>, string> = {
  approved: 'bg-oksoft text-ok',
  rejected: 'bg-badsoft text-bad',
  expired: 'bg-surface2 text-muted',
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

function VoteItem({ vote, mine }: { vote: Vote; mine: boolean }) {
  const approve = vote.decision === 'approve'
  return (
    <li className="flex gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface2/70">
      <span className={clsx('avatar', approve ? '' : 'avatar--muted')}>{initial(vote.author)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[13px] font-semibold">{vote.author}</span>
          <span className="text-[11px] text-muted">карма {vote.karma}</span>
          <span className={clsx('badge !h-5 !px-2 !text-[10px]', approve ? 'badge--ok' : 'badge--bad')}>
            {approve ? 'за' : 'против'}
          </span>
          {mine && (
            <span className="badge badge--neutral !h-5 !px-2 !text-[10px]">ваш голос</span>
          )}
          <span className="ml-auto text-[11px] text-muted">{dayTime(vote.createdAt)}</span>
        </div>
        <p className="mt-1 text-[13.5px] leading-relaxed">{vote.text}</p>
      </div>
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
      <div className="mt-3 rounded-xl bg-surface2 px-3.5 py-3">
        <div className="label">ваш итог</div>
        <p className="mt-1 text-[12.5px] font-medium">
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
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" className="btn" disabled={busy} onClick={() => choose('bought')}>
          Купил
        </button>
        <button
          type="button"
          className="btn !border-ok/40 !text-ok"
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
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-surface2">
          <Icon name="search" className="h-5 w-5 text-muted" />
        </span>
        <h1 className="mt-3 text-[20px] font-semibold tracking-tight">Заявление не найдено</h1>
        <p className="mt-1.5 max-w-sm text-[13px] text-muted">
          Возможно, его отозвали или ссылка устарела.
        </p>
        <Link to="/" className="btn btn--primary mt-5">
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
  const isDemo = params.get('demo') !== null

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
        <Link to="/" className="link inline-flex items-center gap-1.5 text-[12.5px] font-medium">
          <Icon name="arrowLeft" className="h-3.5 w-3.5" />
          К очереди
        </Link>
        <button type="button" onClick={copyLink} className="btn btn--sm btn--ghost">
          <Icon name="link" className="h-3.5 w-3.5" />
          {copied ? 'Скопировано' : 'Ссылка'}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_356px]">
        <article className="card p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mono text-[11px] tracking-wide text-muted">
                {request.code} · {dayTime(request.createdAt)}
              </div>
              <h1 className="mt-1.5 text-[23px] font-bold leading-tight tracking-tight sm:text-[30px]">
                {request.title}
              </h1>
            </div>
            {status !== 'open' && <Stamp status={status} animate />}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl bg-surface2 px-3 py-2.5">
              <div className="label">сумма</div>
              <div className="num mt-0.5 text-[16px] font-bold sm:text-[17px]">{money(request.price)}</div>
            </div>
            <div className="rounded-xl bg-surface2 px-3 py-2.5">
              <div className="label">категория</div>
              <div className="mt-1 text-[13px] font-medium capitalize">{request.category}</div>
            </div>
            <div className="rounded-xl bg-surface2 px-3 py-2.5">
              <div className="label">заявитель</div>
              <div className="mt-0.5 text-[13px] font-medium">{isAuthor ? 'Вы' : request.author}</div>
              <div className="text-[10.5px] text-muted">карма {request.authorKarma}</div>
            </div>
            <div className="rounded-xl bg-surface2 px-3 py-2.5">
              <div className="label">{isOpen ? 'осталось' : 'срок'}</div>
              <div className="mt-1 text-[13px] font-medium">
                {isOpen ? remainingLabel(request.closesAt, now) : dayTime(request.closesAt)}
              </div>
            </div>
          </div>

          <section className="mt-6">
            <h2 className="label">обоснование</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed">{request.reason}</p>
          </section>

          <section className="mt-5">
            <h2 className="label">альтернатива</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{request.alternative}</p>
          </section>

          <div className="divider my-6" />

          <div className="flex items-center justify-between gap-3">
            <h2 className="label">заключения · {tally.total}</h2>
            <TallyBar request={request} showCounts={false} className="w-28" />
          </div>

          {request.votes.length === 0 ? (
            <p className="mt-3 text-[13px] italic text-muted">
              Пока никто не высказался. Первое заключение обычно задаёт тон всему делу.
            </p>
          ) : (
            <ul className="mt-2 -mx-2">
              {request.votes
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((vote) => (
                  <VoteItem key={vote.id} vote={vote} mine={vote.author === CURRENT_USER.name} />
                ))}
            </ul>
          )}
        </article>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          {isOpen ? (
            <div className="card p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="label">голосование</span>
                <span className="text-[11px] font-medium text-muted">{tally.total} голосов</span>
              </div>
              <div className="mt-2.5">
                <TallyBar request={request} />
              </div>

              <div className="mt-4">
                {isAuthor ? (
                  <p className="rounded-xl bg-surface2 px-3.5 py-3 text-[12.5px] leading-relaxed text-muted">
                    Вы заявитель: голосовать за собственную покупку нельзя. Позовите людей — кнопка
                    «Ссылка» выше.
                  </p>
                ) : myVote ? (
                  <div className="rounded-xl bg-surface2 px-3.5 py-3">
                    <div className="label">ваше заключение подписано</div>
                    <p className="mt-1.5 text-[13px] leading-relaxed">{myVote.text}</p>
                    <div
                      className={clsx(
                        'badge mt-2 !h-5 !px-2 !text-[10px]',
                        myVote.decision === 'approve' ? 'badge--ok' : 'badge--bad',
                      )}
                    >
                      {myVote.decision === 'approve' ? 'вы за покупку' : 'вы против покупки'}
                    </div>
                  </div>
                ) : guest ? (
                  <div className="space-y-2.5">
                    <p className="text-[12.5px] leading-relaxed text-muted">
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
            <div className="card p-4 sm:p-5">
              <div
                className={clsx(
                  'flex items-center gap-2.5 rounded-xl px-3.5 py-3',
                  VERDICT_STYLE[status],
                )}
              >
                <Icon name={VERDICT_ICON[status]} className="h-5 w-5" />
                <span className="text-[15px] font-semibold">
                  {status === 'approved' ? 'Одобрено' : status === 'rejected' ? 'Отклонено' : 'Истекло'}
                </span>
              </div>

              <div className="mt-3.5">
                <TallyBar request={request} />
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{VERDICT_TEXT[status]}</p>
              {isAuthor && <OutcomeBlock request={request} />}
            </div>
          )}

          {isOpen && !guest && !myVote && !isAuthor && (
            <div className="card card--quiet p-4">
              <div className="flex items-center gap-1.5">
                <Icon name="clock" className="h-3.5 w-3.5 text-muted" />
                <span className="label">срок рассмотрения</span>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
                Заявка закроется автоматически через {remainingLabel(request.closesAt, now)}. После
                этого голоса не принимаются.
              </p>
            </div>
          )}

          {isDemo && (
            <div className="card card--quiet p-4">
              <div className="label">демонстрационный режим</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                Это прототип без сервера: заявки и голоса живут в вашем браузере.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
