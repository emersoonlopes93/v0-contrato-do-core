export interface OrderAggregate {
  _count?: {
    _all?: number
  }
  _sum?: {
    total?: number | null
  }
  _avg?: {
    total?: number | null
  }
  _max?: {
    created_at?: Date | null
  }
  customer_phone?: string | null
}

export interface TotalAggregate {
  _avg?: {
    total?: number | null
  }
}
