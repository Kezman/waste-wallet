export type Category =
  | 'техника'
  | 'дом'
  | 'одежда'
  | 'здоровье'
  | 'учёба'
  | 'развлечения'
  | 'еда'
  | 'другое'

export type Decision = 'approve' | 'reject'

export type Status = 'open' | 'approved' | 'rejected' | 'expired'

export type Outcome = 'bought' | 'resisted'

export interface Vote {
  id: string
  author: string
  karma: number
  decision: Decision
  text: string
  createdAt: string
}

export interface MoneyRequest {
  id: string
  code: string
  title: string
  price: number
  category: Category
  reason: string
  alternative: string
  author: string
  authorKarma: number
  createdAt: string
  closesAt: string
  status: Status
  votes: Vote[]
  outcome?: Outcome
  mine?: boolean
}

export interface Tally {
  approve: number
  reject: number
  total: number
  approveShare: number
}
