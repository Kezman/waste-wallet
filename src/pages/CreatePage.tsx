import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Icon } from '../components/Icon'
import { money } from '../lib/format'
import { useAppStore } from '../lib/store'
import type { Category } from '../lib/types'

const CATEGORIES: Category[] = [
  'техника',
  'дом',
  'одежда',
  'здоровье',
  'учёба',
  'развлечения',
  'еда',
  'другое',
]

const WINDOWS = [
  { value: 24, label: '24 часа' },
  { value: 48, label: '48 часов' },
  { value: 72, label: '72 часа' },
]

const DRAFT_KEY = 'wallet-wait-draft-v1'

interface Draft {
  title: string
  price: string
  category: Category
  reason: string
  alternative: string
  windowHours: number
}

const EMPTY: Draft = {
  title: '',
  price: '',
  category: 'техника',
  reason: '',
  alternative: '',
  windowHours: 48,
}

function readDraft(): Draft {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<Draft>
    return { ...EMPTY, ...parsed }
  } catch {
    return EMPTY
  }
}

export default function CreatePage() {
  const navigate = useNavigate()
  const createRequest = useAppStore((state) => state.createRequest)
  const requests = useAppStore((state) => state.requests)

  const [draft, setDraft] = useState<Draft>(readDraft)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      /* приватный режим — черновик просто не сохранится */
    }
  }, [draft])

  const priceValue = Number.parseInt(draft.price || '0', 10) || 0
  const nextCode = `З-${String(requests.length + 1).padStart(4, '0')}`
  const reasonLength = draft.reason.trim().length

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[key as string]
      return next
    })
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (draft.title.trim().length < 5) next.title = 'Название короче пяти символов — так непонятно, что вы покупаете.'
    if (priceValue <= 0) next.price = 'Укажите сумму больше нуля.'
    if (reasonLength < 40) next.reason = 'Минимум 40 символов: «хочу» — не обоснование.'
    if (draft.alternative.trim().length < 10) next.alternative = 'Напишите альтернативу или честно: «альтернативы нет».'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setBusy(true)
    setServerError(null)
    try {
      const id = await createRequest({
        title: draft.title,
        price: priceValue,
        category: draft.category,
        reason: draft.reason,
        alternative: draft.alternative,
        windowHours: draft.windowHours,
      })
      try {
        window.localStorage.removeItem(DRAFT_KEY)
      } catch {
        /* ignore */
      }
      navigate(`/request/${id}`)
    } catch (cause) {
      setServerError(cause instanceof Error ? cause.message : 'Не удалось отправить заявление')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Link to="/" className="link inline-flex items-center gap-1.5 text-[12.5px] font-medium">
        <Icon name="arrowLeft" className="h-3.5 w-3.5" />
        К очереди
      </Link>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section className="card p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mono text-[11px] text-muted">{nextCode}</div>
              <h1 className="mt-1 text-[23px] font-bold tracking-tight sm:text-[27px]">
                Что вы хотите купить?
              </h1>
              <p className="mt-1.5 text-[13px] text-muted">
                Заполните четыре поля — этого достаточно для рассмотрения.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="title" className="label block">
                предмет заявления
              </label>
              <input
                id="title"
                value={draft.title}
                onChange={(event) => update('title', event.target.value)}
                placeholder="Например: наушники Sony WH-1000XM5"
                className="input mt-1.5"
                maxLength={120}
              />
              {errors.title && <p className="mt-1.5 text-[11.5px] font-medium text-bad">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="price" className="label block">
                сумма
              </label>
              <div className="relative mt-1.5">
                <input
                  id="price"
                  value={draft.price}
                  onChange={(event) =>
                    update('price', event.target.value.replace(/[^\d]/g, '').slice(0, 9))
                  }
                  placeholder="32 990"
                  inputMode="numeric"
                  className="input num !h-12 !pr-9 !text-[20px] !font-semibold"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[14px] font-medium text-muted">
                  ₽
                </span>
              </div>
              {priceValue > 0 && (
                <p className="mt-1.5 text-[11.5px] text-muted">
                  {money(priceValue)} — примерно {Math.round(priceValue / 400)} чашек кофе.
                </p>
              )}
              {errors.price && <p className="mt-1.5 text-[11.5px] font-medium text-bad">{errors.price}</p>}
            </div>

            <div>
              <span className="label block">категория</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    data-active={draft.category === category}
                    onClick={() => update('category', category)}
                    className="chip"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="reason" className="label">
                  зачем это нужно
                </label>
                <span
                  className={clsx(
                    'num text-[11px] font-medium',
                    reasonLength < 40 ? 'text-muted' : 'text-ok',
                  )}
                >
                  {reasonLength}/700
                </span>
              </div>
              <textarea
                id="reason"
                value={draft.reason}
                onChange={(event) => update('reason', event.target.value)}
                rows={5}
                maxLength={700}
                placeholder="Опишите задачу, а не желание. Что сломано, чего не хватает, что происходит без этой покупки."
                className="textarea mt-1.5"
              />
              <p className="mt-1.5 text-[11.5px] text-muted">
                {reasonLength < 40
                  ? `ещё ${40 - reasonLength} символов до минимума`
                  : 'достаточно для рассмотрения'}
              </p>
              {errors.reason && <p className="mt-1 text-[11.5px] font-medium text-bad">{errors.reason}</p>}
            </div>

            <div>
              <label htmlFor="alternative" className="label block">
                чем можно заменить
              </label>
              <textarea
                id="alternative"
                value={draft.alternative}
                onChange={(event) => update('alternative', event.target.value)}
                rows={3}
                maxLength={400}
                placeholder="Аренда, б/у, сделать самому, отложить до весны. Если ничего — так и напишите."
                className="textarea mt-1.5"
              />
              {errors.alternative && (
                <p className="mt-1.5 text-[11.5px] font-medium text-bad">{errors.alternative}</p>
              )}
            </div>

            <div>
              <span className="label block">срок рассмотрения</span>
              <div className="mt-2 flex gap-1.5">
                {WINDOWS.map((window) => (
                  <button
                    key={window.value}
                    type="button"
                    data-active={draft.windowHours === window.value}
                    onClick={() => update('windowHours', window.value)}
                    className="chip"
                  >
                    {window.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {serverError && (
            <p className="mt-4 rounded-lg bg-badsoft px-3 py-2 text-[12px] font-medium text-bad">
              {serverError}
            </p>
          )}

          <div className="divider my-6" />

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={submit} disabled={busy} className="btn btn--primary">
              <Icon name="check" className="h-4 w-4" />
              {busy ? 'Отправляем…' : 'Отправить в отдел'}
            </button>
            <Link to="/" className="btn btn--ghost">
              Отмена
            </Link>
            <span className="ml-auto text-[11px] text-muted">за свою заявку голосовать нельзя</span>
          </div>
        </section>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="label px-1">так это увидят другие</div>

          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mono rounded-md bg-surface2 px-1.5 py-0.5 text-[10.5px] text-muted">
                {nextCode}
              </span>
              <span className="rounded-md bg-surface2 px-1.5 py-0.5 text-[10.5px] font-medium text-muted">
                {draft.category}
              </span>
            </div>
            <h3 className="mt-2 text-[16.5px] font-semibold leading-snug tracking-tight">
              {draft.title.trim() || 'Без названия'}
            </h3>
            <div className="num mt-1.5 text-[17px] font-bold">
              {priceValue > 0 ? money(priceValue) : '0 ₽'}
            </div>
            <p
              className={clsx(
                'mt-2 line-clamp-4 text-[12.5px] leading-relaxed',
                draft.reason.trim() ? 'text-muted' : 'italic text-muted',
              )}
            >
              {draft.reason.trim() || 'Обоснование появится здесь.'}
            </p>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-surface2 px-2.5 py-1.5">
              <span className="text-[11px] font-medium text-muted">на рассмотрении</span>
              <span className="text-[11px] font-medium text-muted">{draft.windowHours} ч</span>
            </div>
          </div>

          <div className="card card--quiet p-4">
            <div className="flex items-center gap-1.5">
              <Icon name="sparkle" className="h-3.5 w-3.5 text-accent" />
              <span className="label">подсказка</span>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
              Заявки с конкретикой («месяц без покупки — три ошибки в отчётах») получают втрое больше
              аргументированных заключений, чем «просто хочу».
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
