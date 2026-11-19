import { useState } from 'react'
import clsx from 'clsx'
import { useAppStore, VOTE_MIN_LENGTH } from '../lib/store'
import { Icon } from './Icon'
import type { Decision } from '../lib/types'

const PROMPTS = [
  'Уже есть похожее',
  'Подожди до зарплаты',
  'Можно дешевле',
  'Это про эмоции, а не про задачу',
]

interface VoteFormProps {
  requestId: string
}

export function VoteForm({ requestId }: VoteFormProps) {
  const castVote = useAppStore((state) => state.castVote)
  const [decision, setDecision] = useState<Decision>('reject')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = text.trim()
  const tooShort = trimmed.length < VOTE_MIN_LENGTH

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await castVote(requestId, decision, trimmed)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Что-то пошло не так')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setDecision('approve')}
          className={clsx('btn btn--wide', decision === 'approve' && 'btn--ok')}
          aria-pressed={decision === 'approve'}
        >
          <Icon name="check" className="h-4 w-4" />
          Одобрить
        </button>
        <button
          type="button"
          onClick={() => setDecision('reject')}
          className={clsx('btn btn--wide', decision === 'reject' && 'btn--bad')}
          aria-pressed={decision === 'reject'}
        >
          <Icon name="x" className="h-4 w-4" />
          Отклонить
        </button>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <label htmlFor="vote-text" className="label">
          Обоснование — обязательно
        </label>
        <span
          className={clsx(
            'num text-[11px] font-medium',
            tooShort ? 'text-muted' : 'text-ok',
          )}
        >
          {trimmed.length}/{VOTE_MIN_LENGTH}
        </span>
      </div>

      <textarea
        id="vote-text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={4}
        placeholder="Почему вы за или против? Без аргумента голос не принимается."
        className="textarea mt-1.5"
        maxLength={600}
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() =>
              setText((current) =>
                current.trim().length === 0 ? `${prompt}. ` : `${current.trimEnd()} ${prompt}. `,
              )
            }
            className="rounded-full bg-surface2 px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:text-ink"
          >
            {prompt}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-badsoft px-3 py-2 text-[12px] font-medium text-bad">{error}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={tooShort || busy}
        className="btn btn--primary mt-3 h-11 w-full"
      >
        {busy ? 'Отправляем…' : 'Подписать и отправить'}
      </button>
      <p className="mt-2 text-center text-[11px] text-muted">
        Голос нельзя отозвать — как и подпись под документом.
      </p>
    </div>
  )
}
