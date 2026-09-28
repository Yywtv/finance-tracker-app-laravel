import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CircleDollarSign, Filter, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiRequest, getErrorMessage, getFieldErrors, queryString } from '../lib/api'
import { optionLabel, transactionTypeOptions } from '../lib/constants'
import { formatDate, formatMoney, todayInputValue } from '../lib/format'
import { useApiResource } from '../hooks/useApiResource'
import { useToast } from '../components/Toast'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { ConfirmDialog, Modal } from '../components/Modal'
import { DataTable } from '../components/DataTable'
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback'
import { PageHeader } from '../components/PageHeader'
import { Pagination } from '../components/Pagination'
import { StatusBadge } from '../components/StatusBadge'
import type {
    Account,
    ApiFieldErrors,
    Category,
    PaginatedResponse,
    Transaction,
    TransactionType,
} from '../types'

interface TransactionFilters {
    type: '' | TransactionType
    account_id: string
    category_id: string
    from: string
    to: string
}

interface TransactionFormState {
    account_id: string
    category_id: string
    type: TransactionType
    amount: string
    description: string
    transaction_date: string
    notes: string
}

const emptyFilters: TransactionFilters = {
    type: '',
    account_id: '',
    category_id: '',
    from: '',
    to: '',
}

function emptyForm(): TransactionFormState {
    return {
        account_id: '',
        category_id: '',
        type: 'expense',
        amount: '',
        description: '',
        transaction_date: todayInputValue(),
        notes: '',
    }
}

function toForm(transaction: Transaction): TransactionFormState {
    return {
        account_id: String(transaction.account_id),
        category_id: String(transaction.category_id),
        type: transaction.type,
        amount: String(transaction.amount),
        description: transaction.description,
        transaction_date: transaction.transaction_date,
        notes: transaction.notes || '',
    }
}

export function TransactionsPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const { showToast } = useToast()
    const [draftFilters, setDraftFilters] = useState<TransactionFilters>(emptyFilters)
    const [filters, setFilters] = useState<TransactionFilters>(emptyFilters)
    const [page, setPage] = useState(1)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Transaction | null>(null)
    const [form, setForm] = useState<TransactionFormState>(emptyForm)
    const [formError, setFormError] = useState('')
    const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
    const [deleting, setDeleting] = useState(false)

    const accounts = useApiResource<Account[]>('/accounts')
    const categories = useApiResource<Category[]>('/categories')
    const transactionPath = `/transactions${queryString({
        ...filters,
        page: page > 1 ? page : undefined,
    })}`
    const transactions = useApiResource<PaginatedResponse<Transaction>>(transactionPath)

    const accountMap = useMemo(
        () => new Map((accounts.data || []).map((account) => [account.id, account])),
        [accounts.data],
    )
    const categoryMap = useMemo(
        () => new Map((categories.data || []).map((category) => [category.id, category])),
        [categories.data],
    )
    const activeCategories = (categories.data || []).filter((category) => category.is_active)
    const formCategories = activeCategories.filter(
        (category) => category.type === form.type || category.id === Number(form.category_id),
    )
    const rows = transactions.data?.data || []
    const hasActiveFilters = Object.values(filters).some(Boolean)

    useEffect(() => {
        if (location.pathname === '/transactions/new') {
            setEditing(null)
            setForm(emptyForm())
            setFieldErrors({})
            setFormError('')
            setFormOpen(true)
        } else {
            setFormOpen(false)
        }
    }, [location.pathname])

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm())
        setFieldErrors({})
        setFormError('')
        setFormOpen(true)
    }

    const closeForm = () => {
        setFormOpen(false)
        if (location.pathname === '/transactions/new') navigate('/transactions', { replace: true })
    }

    const openEdit = (transaction: Transaction) => {
        setEditing(transaction)
        setForm(toForm(transaction))
        setFieldErrors({})
        setFormError('')
        setFormOpen(true)
    }

    const updateForm = <K extends keyof TransactionFormState>(key: K, value: TransactionFormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }))
        setFieldErrors((current) => ({ ...current, [key]: '' }))
    }

    const handleTypeChange = (type: TransactionType) => {
        setForm((current) => {
            const selected = activeCategories.find((category) => category.id === Number(current.category_id))
            return {
                ...current,
                type,
                category_id: selected?.type === type ? current.category_id : '',
            }
        })
    }

    const applyFilters = () => {
        setFilters(draftFilters)
        setPage(1)
    }

    const resetFilters = () => {
        setDraftFilters(emptyFilters)
        setFilters(emptyFilters)
        setPage(1)
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFormError('')
        setFieldErrors({})

        const amount = Number(form.amount)
        const nextErrors: ApiFieldErrors = {}
        if (!form.account_id) nextErrors.account_id = ['Choose an account.']
        if (!form.category_id) nextErrors.category_id = ['Choose a category.']
        if (!form.description.trim()) nextErrors.description = ['Add a short description.']
        if (!form.transaction_date) nextErrors.transaction_date = ['Choose a date.']
        if (!Number.isSafeInteger(amount) || amount < 1) nextErrors.amount = ['Enter a whole number greater than zero.']

        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors)
            return
        }

        setSaving(true)
        try {
            const payload = {
                account_id: Number(form.account_id),
                category_id: Number(form.category_id),
                type: form.type,
                amount,
                description: form.description.trim(),
                transaction_date: form.transaction_date,
                notes: form.notes.trim() || null,
            }
            await apiRequest<Transaction>(editing ? `/transactions/${editing.id}` : '/transactions', {
                method: editing ? 'PUT' : 'POST',
                body: payload,
            })
            closeForm()
            showToast(editing ? 'Transaction updated.' : 'Transaction recorded.')
            await transactions.reload()
        } catch (error) {
            setFormError(getErrorMessage(error, 'Unable to save the transaction.'))
            setFieldErrors(getFieldErrors(error))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await apiRequest(`/transactions/${deleteTarget.id}`, { method: 'DELETE' })
            setDeleteTarget(null)
            showToast('Transaction deleted.')
            await transactions.reload()
        } catch (error) {
            showToast(getErrorMessage(error, 'Unable to delete the transaction.'), 'error')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="page-stack">
            <PageHeader
                eyebrow="Workspace"
                title="Transactions"
                description="Record and review the income and expenses that shape your balance."
                action={<Button onClick={openCreate} icon={<Plus size={17} aria-hidden="true" />}>Add transaction</Button>}
            />

            <section className="surface">
                <div className="toolbar toolbar-wrap">
                    <div className="toolbar-summary">
                        <strong>{transactions.data?.total ?? 0}</strong>
                        <span>transactions</span>
                    </div>
                    <div className="toolbar-actions">
                        <Button
                            variant={filtersOpen || hasActiveFilters ? 'secondary' : 'ghost'}
                            onClick={() => setFiltersOpen((current) => !current)}
                            icon={<Filter size={16} aria-hidden="true" />}
                        >
                            Filters{hasActiveFilters ? ' · active' : ''}
                        </Button>
                        {hasActiveFilters ? (
                            <Button variant="ghost" onClick={resetFilters} icon={<X size={15} aria-hidden="true" />}>Reset</Button>
                        ) : null}
                    </div>
                </div>

                {filtersOpen ? (
                    <div className="filter-panel">
                        <div className="form-grid-three">
                            <Field label="Type">
                                {(props) => <select {...props} value={draftFilters.type} onChange={(event) => setDraftFilters((current) => ({ ...current, type: event.target.value as TransactionFilters['type'] }))}><option value="">All types</option>{transactionTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
                            </Field>
                            <Field label="Account">
                                {(props) => <select {...props} value={draftFilters.account_id} onChange={(event) => setDraftFilters((current) => ({ ...current, account_id: event.target.value }))}><option value="">All accounts</option>{(accounts.data || []).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select>}
                            </Field>
                            <Field label="Category">
                                {(props) => <select {...props} value={draftFilters.category_id} onChange={(event) => setDraftFilters((current) => ({ ...current, category_id: event.target.value }))}><option value="">All categories</option>{(categories.data || []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>}
                            </Field>
                        </div>
                        <div className="form-grid-two filter-date-row">
                            <Field label="From date">
                                {(props) => <input {...props} type="date" value={draftFilters.from} onChange={(event) => setDraftFilters((current) => ({ ...current, from: event.target.value }))} />}
                            </Field>
                            <Field label="To date">
                                {(props) => <input {...props} type="date" value={draftFilters.to} onChange={(event) => setDraftFilters((current) => ({ ...current, to: event.target.value }))} />}
                            </Field>
                        </div>
                        <div className="filter-actions"><Button size="sm" onClick={applyFilters}>Apply filters</Button></div>
                    </div>
                ) : null}

                {accounts.error || categories.error ? (
                    <ErrorState
                        message="Account and category options could not be loaded. Refresh before creating a transaction."
                        onRetry={() => { void accounts.reload(); void categories.reload() }}
                    />
                ) : null}

                {transactions.isLoading ? (
                    <LoadingState label="Loading transactions" />
                ) : transactions.error ? (
                    <ErrorState message="We could not load transactions." onRetry={() => void transactions.reload()} />
                ) : rows.length === 0 ? (
                    <EmptyState
                        title={hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
                        description={hasActiveFilters ? 'Try changing or resetting the filters.' : 'Add your first income or expense to start building a clear picture.'}
                        action={!hasActiveFilters ? <Button size="sm" onClick={openCreate} icon={<Plus size={15} aria-hidden="true" />}>Add transaction</Button> : undefined}
                    />
                ) : (
                    <>
                        <DataTable
                            rows={rows}
                            rowKey={(transaction) => transaction.id}
                            columns={[
                                { key: 'date', header: 'Date', render: (transaction) => formatDate(transaction.transaction_date) },
                                {
                                    key: 'description',
                                    header: 'Description',
                                    render: (transaction) => <div className="primary-cell"><span className="row-icon"><CircleDollarSign size={16} aria-hidden="true" /></span><span><strong>{transaction.description}</strong><small>{categoryMap.get(transaction.category_id)?.name || 'Uncategorized'}</small></span></div>,
                                },
                                { key: 'type', header: 'Type', render: (transaction) => <StatusBadge tone={transaction.type === 'income' ? 'positive' : 'negative'}>{optionLabel(transactionTypeOptions, transaction.type)}</StatusBadge> },
                                { key: 'account', header: 'Account', render: (transaction) => accountMap.get(transaction.account_id)?.name || 'Unknown' },
                                {
                                    key: 'amount',
                                    header: 'Amount',
                                    align: 'right',
                                    render: (transaction) => <strong className={transaction.type === 'income' ? 'amount-positive' : 'amount-negative'}>{transaction.type === 'income' ? '+' : '−'}{formatMoney(transaction.amount, accountMap.get(transaction.account_id)?.currency)}</strong>,
                                },
                                {
                                    key: 'actions',
                                    header: <span className="sr-only">Actions</span>,
                                    align: 'right',
                                    render: (transaction) => <div className="row-actions"><button type="button" className="icon-button" onClick={() => openEdit(transaction)} aria-label={`Edit ${transaction.description}`}><Pencil size={16} aria-hidden="true" /></button><button type="button" className="icon-button danger-icon" onClick={() => setDeleteTarget(transaction)} aria-label={`Delete ${transaction.description}`}><Trash2 size={16} aria-hidden="true" /></button></div>,
                                },
                            ]}
                            mobile={(transaction) => {
                                const account = accountMap.get(transaction.account_id)
                                return <div className="mobile-record"><div className="mobile-record-header"><div className="primary-cell"><span className="row-icon"><CircleDollarSign size={16} aria-hidden="true" /></span><span><strong>{transaction.description}</strong><small>{formatDate(transaction.transaction_date)} · {account?.name || 'Unknown account'}</small></span></div><strong className={transaction.type === 'income' ? 'amount-positive' : 'amount-negative'}>{transaction.type === 'income' ? '+' : '−'}{formatMoney(transaction.amount, account?.currency)}</strong></div><div className="mobile-record-footer"><StatusBadge tone={transaction.type === 'income' ? 'positive' : 'negative'}>{optionLabel(transactionTypeOptions, transaction.type)}</StatusBadge><span>{categoryMap.get(transaction.category_id)?.name || 'Uncategorized'}</span></div><div className="mobile-record-actions"><Button size="sm" variant="secondary" onClick={() => openEdit(transaction)} icon={<Pencil size={15} aria-hidden="true" />}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDeleteTarget(transaction)} icon={<Trash2 size={15} aria-hidden="true" />}>Delete</Button></div></div>
                            }}
                        />
                        <Pagination currentPage={transactions.data?.current_page || page} lastPage={transactions.data?.last_page || 1} total={transactions.data?.total || 0} onPageChange={setPage} />
                    </>
                )}
            </section>

            <Modal open={formOpen} title={editing ? 'Edit transaction' : 'Add transaction'} description={editing ? 'Update the transaction details below.' : 'Record an income or expense against one of your accounts.'} onClose={closeForm} size="lg">
                {formError ? <div className="form-alert" role="alert">{formError}</div> : null}
                <form className="form-stack" onSubmit={handleSubmit} noValidate>
                    <div className="form-grid-two">
                        <Field label="Type" error={fieldErrors.type?.[0]} required>
                            {(props) => <select {...props} value={form.type} onChange={(event) => handleTypeChange(event.target.value as TransactionType)}>{transactionTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
                        </Field>
                        <Field label="Amount" error={fieldErrors.amount?.[0]} hint="Whole currency units only." required>
                            {(props) => <input {...props} type="number" min="1" step="1" inputMode="numeric" placeholder="0" value={form.amount} onChange={(event) => updateForm('amount', event.target.value)} />}
                        </Field>
                    </div>
                    <Field label="Account" error={fieldErrors.account_id?.[0]} required>
                        {(props) => <select {...props} value={form.account_id} onChange={(event) => updateForm('account_id', event.target.value)}><option value="">Select an account</option>{(accounts.data || []).filter((account) => account.is_active).map((account) => <option key={account.id} value={account.id}>{account.name} ({account.currency})</option>)}</select>}
                    </Field>
                    <Field label="Category" error={fieldErrors.category_id?.[0]} hint={formCategories.length === 0 ? 'Add an active category for this transaction type first.' : undefined} required>
                        {(props) => <select {...props} value={form.category_id} onChange={(event) => updateForm('category_id', event.target.value)}><option value="">Select a category</option>{formCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>}
                    </Field>
                    <Field label="Description" error={fieldErrors.description?.[0]} required>
                        {(props) => <input {...props} type="text" maxLength={255} placeholder="What was this for?" value={form.description} onChange={(event) => updateForm('description', event.target.value)} />}
                    </Field>
                    <div className="form-grid-two">
                        <Field label="Date" error={fieldErrors.transaction_date?.[0]} required>
                            {(props) => <input {...props} type="date" value={form.transaction_date} onChange={(event) => updateForm('transaction_date', event.target.value)} />}
                        </Field>
                        <Field label="Notes" error={fieldErrors.notes?.[0]}>
                            {(props) => <input {...props} type="text" placeholder="Optional note" value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} />}
                        </Field>
                    </div>
                    <div className="modal-actions"><Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button><Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Record transaction'}</Button></div>
                </form>
            </Modal>

            <ConfirmDialog open={Boolean(deleteTarget)} title="Delete transaction?" description={`This will permanently remove “${deleteTarget?.description || 'this transaction'}”.`} loading={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={() => void handleDelete()} />
        </div>
    )
}
