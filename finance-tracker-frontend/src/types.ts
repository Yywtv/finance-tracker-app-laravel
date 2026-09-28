export type TransactionType = 'income' | 'expense'
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly'
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type AccountType =
    | 'checking'
    | 'savings'
    | 'cash'
    | 'e_wallet'
    | 'credit_card'
    | 'investment'
    | 'other'

export interface User {
    id: number
    name: string
    email: string
    email_verified_at: string | null
    created_at?: string
    updated_at?: string
}

export interface Account {
    id: number
    user_id: number
    name: string
    type: string
    currency: string
    initial_balance: number
    is_active: boolean
    created_at?: string
    updated_at?: string
}

export interface Category {
    id: number
    user_id: number
    name: string
    type: TransactionType
    icon: string | null
    color: string | null
    is_active: boolean
    created_at?: string
    updated_at?: string
}

export interface Transaction {
    id: number
    user_id: number
    account_id: number
    category_id: number
    type: TransactionType
    amount: number
    description: string
    transaction_date: string
    notes: string | null
    created_at?: string
    updated_at?: string
}

export interface Transfer {
    id: number
    user_id: number
    from_account_id: number
    to_account_id: number
    amount: number
    transfer_date: string
    description: string | null
    created_at?: string
    updated_at?: string
}

export interface Budget {
    id: number
    user_id: number
    category_id: number
    amount: number
    period: BudgetPeriod
    start_date: string
    end_date: string | null
    created_at?: string
    updated_at?: string
}

export interface RecurringTransfer {
    id: number
    user_id: number
    from_account_id: number
    to_account_id: number
    amount: number
    frequency: RecurringFrequency
    next_occurrence: string
    start_date: string
    end_date: string | null
    is_active: boolean
    created_at?: string
    updated_at?: string
}

export interface TransactionAttachment {
    id: number
    transaction_id: number
    file_path: string
    original_filename: string
    mime_type: 'image/jpeg' | 'image/png' | 'application/pdf'
    file_size: number
    created_at?: string
    updated_at?: string
}

export interface DashboardData {
    total_balance: number
    income_this_month: number
    expenses_this_month: number
    recent_transactions: Transaction[]
}

export interface PaginationMeta {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
}

export interface PaginatedResponse<T> {
    current_page: number
    data: T[]
    first_page_url?: string
    from: number | null
    last_page: number
    last_page_url?: string
    links?: Array<{ url: string | null; label: string; active: boolean }>
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number | null
    total: number
}

export interface AuthResponse {
    user: User
    token?: string
}

export type ApiFieldErrors = Record<string, string[] | string>

export interface ApiErrorPayload {
    message?: string
    errors?: ApiFieldErrors
}
