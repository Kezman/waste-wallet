import { useState } from 'react'
import clsx from 'clsx'
import { useAppStore, VOTE_MIN_LENGTH } from '../lib/store'
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
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setDecision('approve')}
          className={clsx('btn btn--wide', decision === 'approve' && 'btn--approve')}
          aria-pressed={decision === 'approve'}
        >
          Одобрить
        </button>
        <button
          type="button"
          onClick={() => setDecision('reject')}
          className={clsx('btn btn--wide', decision === 'reject' && 'btn--reject')}
          aria-pressed={decision === 'reject'}
        >
          Отклонить
        </button>
      </div>

      <label htmlFor="vote-text" className="label mt-4 block">
        Обоснование — обязательно
      </label>
      <textarea
        id="vote-text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={4}
        placeholder="Напишите, почему вы за или против. Без аргумента голос не принимается."
        className="textarea mt-1.5"
        maxLength={600}
      />

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() =>
                setText((current) => (current.trim().length === 0 ? `${prompt}. ` : `${current.trimEnd()} ${prompt}. `))
              }
              className="chip !px-2 !py-1 !text-[9.5px] !normal-case !tracking-normal"
            >
              {prompt}
            </button>
          ))}
        </div>
        <span
          className={clsx(
            'num shrink-0 text-[11px]',
            tooShort ? 'text-ink-soft/70' : 'text-approve',
          )}
        >
          {trimmed.length}/{VOTE_MIN_LENGTH}
        </span>
      </div>

      {error && (
        <p className="mt-3 border-l-2 border-stamp bg-stamp/5 px-2 py-1.5 text-[12px] text-stamp">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={tooShort || busy}
        className="btn btn--solid mt-3 w-full"
      >
        {busy ? 'Отправляем…' : 'Подписать и отправить'}
      </button>
      <p className="mt-2 text-center text-[10.5px] text-ink-soft/80">
        Голос нельзя отозвать — как и подпись под документом.
      </p>
    </div>
  )
}
