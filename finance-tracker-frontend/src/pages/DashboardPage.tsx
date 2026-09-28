import {
    ArrowUpRight,
    CircleDollarSign,
    Plus,
    ReceiptText,
    Repeat2,
    WalletCards,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback'
import { Button } from '../components/Button'
import { useApiResource } from '../hooks/useApiResource'
import { formatDate, formatMoney, formatNumber, titleCase } from '../lib/format'
import type {
    Account,
    Budget,
    Category,
    DashboardData,
    RecurringTransfer,
} from '../types'

function MetricCard({
    label,
    value,
    detail,
    tone = 'default',
}: {
    label: string
    value: string
    detail: string
    tone?: 'default' | 'positive' | 'negative'
}) {
    return (
        <div className={`metric-card metric-${tone}`}>
            <div className="metric-label">{label}</div>
            <div className="metric-value">{value}</div>
            <div className="metric-detail">{detail}</div>
        </div>
    )
}

export function DashboardPage() {
    const navigate = useNavigate()
    const dashboard = useApiResource<DashboardData>('/dashboard')
    const accounts = useApiResource<Account[]>('/accounts')
    const categories = useApiResource<Category[]>('/categories')
    const budgets = useApiResource<Budget[]>('/budgets')
    const recurring = useApiResource<RecurringTransfer[]>('/recurring-transfers')

    const accountMap = new Map((accounts.data || []).map((account) => [account.id, account]))
    const categoryMap = new Map((categories.data || []).map((category) => [category.id, category]))
    const activeAccounts = (accounts.data || []).filter((account) => account.is_active).length
    const activeRecurring = (recurring.data || []).filter((item) => item.is_active).length

    if (dashboard.isLoading) return <LoadingState label="Loading your overview" />

    if (dashboard.error || !dashboard.data) {
        return (
            <>
                <PageHeader title="Overview" description="Your financial snapshot." />
                <ErrorState
                    message="We could not load your dashboard right now."
                    onRetry={() => void dashboard.reload()}
                />
            </>
        )
    }

    const data = dashboard.data
    const recentTransactions = data.recent_transactions || []

    return (
        <div className="page-stack">
            <PageHeader
                eyebrow="Workspace overview"
                title="Your money, at a glance"
                description="A focused view of the information available in your Ledgerly account."
                action={
                    <Button
                        onClick={() => navigate('/transactions/new')}
                        icon={<Plus size={17} aria-hidden="true" />}
                    >
                        Add transaction
                    </Button>
                }
            />

            <section className="metric-grid" aria-label="Financial summary">
                <MetricCard
                    label="Total balance"
                    value={formatNumber(data.total_balance)}
                    detail="As reported by the API"
                />
                <MetricCard
                    label="Income this month"
                    value={formatNumber(data.income_this_month)}
                    detail="Recorded income"
                    tone="positive"
                />
                <MetricCard
                    label="Expenses this month"
                    value={formatNumber(data.expenses_this_month)}
                    detail="Recorded expenses"
                    tone="negative"
                />
                <MetricCard
                    label="Active accounts"
                    value={activeAccounts ? String(activeAccounts) : '—'}
                    detail={
                        activeRecurring
                            ? `${activeRecurring} active recurring transfer${activeRecurring === 1 ? '' : 's'}`
                            : 'No active recurring transfers'
                    }
                />
            </section>

            <div className="dashboard-grid">
                <section className="surface dashboard-transactions">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">Latest activity</p>
                            <h2>Recent transactions</h2>
                        </div>
                        <Link className="text-link" to="/transactions">
                            View all <ArrowUpRight size={15} aria-hidden="true" />
                        </Link>
                    </div>
                    {recentTransactions.length === 0 ? (
                        <EmptyState
                            title="No transactions yet"
                            description="Record your first income or expense to see it here."
                            action={
                                <Button
                                    size="sm"
                                    onClick={() => navigate('/transactions/new')}
                                    icon={<Plus size={15} aria-hidden="true" />}
                                >
                                    Add transaction
                                </Button>
                            }
                        />
                    ) : (
                        <div className="activity-list">
                            {recentTransactions.map((transaction) => {
                                const account = accountMap.get(transaction.account_id)
                                const category = categoryMap.get(transaction.category_id)
                                const positive = transaction.type === 'income'

                                return (
                                    <div className="activity-row" key={transaction.id}>
                                        <div className={`activity-mark ${positive ? 'mark-positive' : 'mark-negative'}`}>
                                            {positive ? '+' : '−'}
                                        </div>
                                        <div className="activity-copy">
                                            <strong>{transaction.description}</strong>
                                            <span>
                                                {category?.name || 'Uncategorized'} · {formatDate(transaction.transaction_date)}
                                            </span>
                                        </div>
                                        <div className="activity-amount">
                                            <strong className={positive ? 'amount-positive' : 'amount-negative'}>
                                                {positive ? '+' : '−'}
                                                {formatMoney(transaction.amount, account?.currency)}
                                            </strong>
                                            <span>{account?.name || 'Unknown account'}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>

                <section className="surface dashboard-side">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">Your setup</p>
                            <h2>Workspace health</h2>
                        </div>
                    </div>
                    <div className="health-list">
                        <Link to="/accounts" className="health-row">
                            <span className="health-icon"><WalletCards size={18} aria-hidden="true" /></span>
                            <span>
                                <strong>Accounts</strong>
                                <small>{activeAccounts} active account{activeAccounts === 1 ? '' : 's'}</small>
                            </span>
                            <ArrowUpRight size={16} aria-hidden="true" />
                        </Link>
                        <Link to="/transactions" className="health-row">
                            <span className="health-icon"><ReceiptText size={18} aria-hidden="true" /></span>
                            <span>
                                <strong>Transactions</strong>
                                <small>Review income and expenses</small>
                            </span>
                            <ArrowUpRight size={16} aria-hidden="true" />
                        </Link>
                        <Link to="/transfers" className="health-row">
                            <span className="health-icon"><Repeat2 size={18} aria-hidden="true" /></span>
                            <span>
                                <strong>Transfers</strong>
                                <small>Move money between accounts</small>
                            </span>
                            <ArrowUpRight size={16} aria-hidden="true" />
                        </Link>
                        <Link to="/budgets" className="health-row">
                            <span className="health-icon"><CircleDollarSign size={18} aria-hidden="true" /></span>
                            <span>
                                <strong>Budgets</strong>
                                <small>{(budgets.data || []).length} budget definition{(budgets.data || []).length === 1 ? '' : 's'}</small>
                            </span>
                            <ArrowUpRight size={16} aria-hidden="true" />
                        </Link>
                    </div>
                    <div className="dashboard-note">
                        <strong>About the total balance</strong>
                        <p>
                            The API returns the sum of account opening balances and recorded
                            transactions. It does not convert between account currencies.
                        </p>
                    </div>
                </section>
            </div>

            <section className="surface accounts-overview">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Accounts</p>
                        <h2>Opening balances</h2>
                    </div>
                    <Link className="text-link" to="/accounts">
                        Manage accounts <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                </div>
                {accounts.isLoading ? (
                    <LoadingState label="Loading accounts" />
                ) : accounts.error ? (
                    <ErrorState
                        message="Account balances could not be loaded."
                        onRetry={() => void accounts.reload()}
                    />
                ) : (accounts.data || []).length === 0 ? (
                    <EmptyState
                        title="No accounts yet"
                        description="Add an account before recording transactions."
                        action={
                            <Button size="sm" onClick={() => navigate('/accounts/new')}>
                                Add account
                            </Button>
                        }
                    />
                ) : (
                    <div className="account-strip">
                        {(accounts.data || []).map((account) => (
                            <Link className="account-strip-item" to="/accounts" key={account.id}>
                                <span className="account-type-icon">
                                    <WalletCards size={17} aria-hidden="true" />
                                </span>
                                <span>
                                    <strong>{account.name}</strong>
                                    <small>{titleCase(account.type)} · {account.currency}</small>
                                </span>
                                <b>{formatMoney(account.initial_balance, account.currency)}</b>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
