import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CURRENT_USER, seedRequests } from './seed'
import type { Category, Decision, MoneyRequest, Outcome } from './types'

export const VOTE_MIN_LENGTH = 20
export const WINDOW_HOURS = 48

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export interface CreateRequestInput {
  title: string
  price: number
  category: Category
  reason: string
  alternative: string
  windowHours: number
}

interface AppState {
  requests: MoneyRequest[]
  timeOffsetMs: number
  simulateError: boolean
  guest: boolean
  createRequest: (input: CreateRequestInput) => Promise<string>
  castVote: (requestId: string, decision: Decision, text: string) => Promise<void>
  setOutcome: (requestId: string, outcome: Outcome) => Promise<void>
  shiftTime: (hours: number) => void
  resetTime: () => void
  resetDemo: () => void
  setSimulateError: (value: boolean) => void
  setGuest: (value: boolean) => void
}

function nextCode(requests: MoneyRequest[]): string {
  const max = requests.reduce((acc, request) => {
    const parsed = Number.parseInt(request.code.replace(/\D/g, ''), 10)
    return Number.isFinite(parsed) && parsed > acc ? parsed : acc
  }, 0)
  return `З-${String(max + 1).padStart(4, '0')}`
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      requests: seedRequests(Date.now()),
      timeOffsetMs: 0,
      simulateError: false,
      guest: false,

      async createRequest(input) {
        await sleep(520)
        if (get().simulateError) throw new Error('Сервер не отвечает. Демонстрационная ошибка сети.')
        const now = Date.now() + get().timeOffsetMs
        const request: MoneyRequest = {
          id: `req-new-${now}`,
          code: nextCode(get().requests),
          title: input.title.trim(),
          price: input.price,
          category: input.category,
          reason: input.reason.trim(),
          alternative: input.alternative.trim(),
          author: CURRENT_USER.name,
          authorKarma: CURRENT_USER.karma,
          createdAt: new Date(now).toISOString(),
          closesAt: new Date(now + input.windowHours * 3_600_000).toISOString(),
          status: 'open',
          votes: [],
          mine: true,
        }
        set((state) => ({ requests: [request, ...state.requests] }))
        return request.id
      },

      async castVote(requestId, decision, text) {
        await sleep(420)
        if (get().simulateError) throw new Error('Голос не принят: сервер не отвечает. Демонстрационная ошибка.')
        set((state) => ({
          requests: state.requests.map((request) => {
            if (request.id !== requestId) return request
            if (request.votes.some((vote) => vote.author === CURRENT_USER.name)) return request
            return {
              ...request,
              votes: [
                ...request.votes,
                {
                  id: `${requestId}-v-${Date.now()}`,
                  author: CURRENT_USER.name,
                  karma: CURRENT_USER.karma,
                  decision,
                  text: text.trim(),
                  createdAt: new Date(Date.now() + state.timeOffsetMs).toISOString(),
                },
              ],
            }
          }),
        }))
      },

      async setOutcome(requestId, outcome) {
        await sleep(300)
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === requestId ? { ...request, outcome } : request,
          ),
        }))
      },

      shiftTime(hours) {
        set((state) => ({ timeOffsetMs: state.timeOffsetMs + hours * 3_600_000 }))
      },

      resetTime() {
        set({ timeOffsetMs: 0 })
      },

      resetDemo() {
        set({ requests: seedRequests(Date.now()), timeOffsetMs: 0 })
      },

      setSimulateError(value) {
        set({ simulateError: value })
      },

      setGuest(value) {
        set({ guest: value })
      },
    }),
    {
      name: 'wallet-wait-demo-v1',
      version: 1,
      partialize: (state) => ({
        requests: state.requests,
        timeOffsetMs: state.timeOffsetMs,
        simulateError: state.simulateError,
        guest: state.guest,
      }),
    },
  ),
)

/** Сумма, которую сообщество помогло не потратить. */
export function savedTotal(requests: MoneyRequest[]): number {
  return requests.reduce((acc, request) => {
    const resisted = request.outcome === 'resisted' || request.status === 'rejected'
    return resisted ? acc + request.price : acc
  }, 0)
}

export function decidedCount(requests: MoneyRequest[]): number {
  return requests.filter((request) => request.status !== 'open').length
}
