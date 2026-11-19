import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
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
    if (draft.title.trim().length < 5) next.title = 'Название короче пяти символов — так никто не поймёт, что вы покупаете.'
    if (priceValue <= 0) next.price = 'Укажите сумму больше нуля.'
    if (draft.reason.trim().length < 40) next.reason = 'Минимум 40 символов: «хочу» — не обоснование.'
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
      <Link
        to="/"
        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
      >
        ← К очереди
      </Link>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="sheet px-5 py-6 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="label">заявление на расход · {nextCode}</div>
              <h1 className="doc-title mt-1.5 text-[24px] text-ink sm:text-[28px]">
                Что вы хотите купить?
              </h1>
            </div>
            <div className="hidden text-right sm:block">
              <div className="label">черновик</div>
              <div className="text-[10.5px] text-ink-soft/80">сохраняется сам</div>
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
                className="input mt-1"
                maxLength={120}
              />
              {errors.title && <p className="mt-1 text-[11.5px] text-stamp">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="price" className="label block">
                сумма
              </label>
              <div className="flex items-baseline gap-2">
                <input
                  id="price"
                  value={draft.price}
                  onChange={(event) => update('price', event.target.value.replace(/[^\d]/g, '').slice(0, 9))}
                  placeholder="32 990"
                  inputMode="numeric"
                  className="input num mt-1 !text-[22px]"
                />
                <span className="num text-[15px] text-ink-soft">₽</span>
              </div>
              {priceValue > 0 && (
                <p className="mt-1 text-[11px] text-ink-soft/80">
                  {money(priceValue)} — примерно {Math.round(priceValue / 400)} чашек кофе.
                </p>
              )}
              {errors.price && <p className="mt-1 text-[11.5px] text-stamp">{errors.price}</p>}
            </div>

            <div>
              <span className="label block">категория</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
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
              <label htmlFor="reason" className="label block">
                зачем это нужно
              </label>
              <textarea
                id="reason"
                value={draft.reason}
                onChange={(event) => update('reason', event.target.value)}
                rows={5}
                maxLength={700}
                placeholder="Опишите задачу, а не желание. Что сломано, чего не хватает, что происходит без этой покупки."
                className="textarea mt-1.5"
              />
              <div className="mt-1 flex justify-between">
                <span className="text-[11px] text-ink-soft/80">
                  {draft.reason.trim().length < 40
                    ? `ещё ${40 - draft.reason.trim().length} символов`
                    : 'достаточно для рассмотрения'}
                </span>
                <span className="num text-[11px] text-ink-soft/70">{draft.reason.length}/700</span>
              </div>
              {errors.reason && <p className="mt-1 text-[11.5px] text-stamp">{errors.reason}</p>}
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
              {errors.alternative && <p className="mt-1 text-[11.5px] text-stamp">{errors.alternative}</p>}
            </div>

            <div>
              <span className="label block">срок рассмотрения</span>
              <div className="mt-1.5 flex gap-1.5">
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
            <p className="mt-4 border-l-2 border-stamp bg-stamp/5 px-2.5 py-2 text-[12px] text-stamp">
              {serverError}
            </p>
          )}

          <div className="perf mt-6 flex flex-wrap items-center gap-2 pt-4">
            <button type="button" onClick={submit} disabled={busy} className="btn btn--solid">
              {busy ? 'Отправляем…' : 'Отправить в отдел'}
            </button>
            <Link to="/" className="btn btn--ghost">
              Отмена
            </Link>
            <span className="label ml-auto !text-[9px] text-ink-soft/70">
              голосовать за свою заявку нельзя
            </span>
          </div>
        </section>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="label px-1">так это увидят другие</div>
          <div className="sheet px-4 py-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="num text-[10px] text-ink-soft">{nextCode}</span>
              <span className="tag">{draft.category}</span>
            </div>
            <h3 className="doc-title mt-1.5 text-[18px] leading-snug">
              {draft.title.trim() || 'Без названия'}
            </h3>
            <div className="num mt-1.5 text-[17px] font-semibold">
              {priceValue > 0 ? money(priceValue) : '0 ₽'}
            </div>
            <p
              className={clsx(
                'mt-2 line-clamp-4 font-serif text-[13px] leading-relaxed',
                draft.reason.trim() ? 'text-ink-soft' : 'italic text-ink-soft/60',
              )}
            >
              {draft.reason.trim() || 'Обоснование появится здесь.'}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-rule pt-2">
              <span className="label !text-[9px]">на рассмотрении</span>
              <span className="label !text-[9px]">{draft.windowHours} ч</span>
            </div>
          </div>

          <div className="sheet sheet--quiet px-3.5 py-3">
            <div className="label">подсказка</div>
            <p className="mt-1.5 font-serif text-[12px] leading-relaxed text-ink-soft">
              Заявки, где есть конкретика («месяц без покупки — три ошибки в отчётах»), получают втрое
              больше аргументированных заключений, чем «просто хочу».
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
