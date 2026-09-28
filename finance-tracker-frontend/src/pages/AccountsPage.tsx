import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Pencil, Plus, Search, Trash2, WalletCards } from 'lucide-react'
import { apiRequest, getErrorMessage, getFieldErrors } from '../lib/api'
import { accountTypeOptions } from '../lib/constants'
import { formatDate, formatMoney, titleCase } from '../lib/format'
import { useApiResource } from '../hooks/useApiResource'
import { useToast } from '../components/Toast'
import { Button } from '../components/Button'
import { CheckboxField, Field } from '../components/Field'
import { ConfirmDialog, Modal } from '../components/Modal'
import { DataTable } from '../components/DataTable'
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import type { Account, ApiFieldErrors } from '../types'

interface AccountFormState {
    name: string
    type: string
    currency: string
    initial_balance: string
    is_active: boolean
}

const emptyForm: AccountFormState = {
    name: '',
    type: 'checking',
    currency: 'IDR',
    initial_balance: '0',
    is_active: true,
}

function toForm(account?: Account): AccountFormState {
    if (!account) return emptyForm
    return {
        name: account.name,
        type: account.type,
        currency: account.currency,
        initial_balance: String(account.initial_balance),
        is_active: account.is_active,
    }
}

export function AccountsPage() {
    const { showToast } = useToast()
    const location = useLocation()
    const navigate = useNavigate()
    const accounts = useApiResource<Account[]>('/accounts')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Account | null>(null)
    const [form, setForm] = useState<AccountFormState>(emptyForm)
    const [formError, setFormError] = useState('')
    const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)
    const [deleting, setDeleting] = useState(false)

    const filteredAccounts = useMemo(() => {
        const query = search.trim().toLowerCase()
        return (accounts.data || []).filter((account) => {
            const matchesSearch =
                !query ||
                [account.name, account.type, account.currency].some((value) =>
                    value.toLowerCase().includes(query),
                )
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' ? account.is_active : !account.is_active)
            return matchesSearch && matchesStatus
        })
    }, [accounts.data, search, statusFilter])

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm)
        setFieldErrors({})
        setFormError('')
        setFormOpen(true)
    }

    const closeForm = () => {
        setFormOpen(false)
        if (location.pathname === '/accounts/new') navigate('/accounts', { replace: true })
    }

    useEffect(() => {
        if (location.pathname === '/accounts/new') openCreate()
        else setFormOpen(false)
    }, [location.pathname])

    const openEdit = (account: Account) => {
        setEditing(account)
        setForm(toForm(account))
        setFieldErrors({})
        setFormError('')
        setFormOpen(true)
    }

    const updateForm = <K extends keyof AccountFormState>(key: K, value: AccountFormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }))
        setFieldErrors((current) => ({ ...current, [key]: '' }))
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFormError('')
        setFieldErrors({})

        const amount = Number(form.initial_balance)
        const nextErrors: ApiFieldErrors = {}
        if (!form.name.trim()) nextErrors.name = ['Enter an account name.']
        if (!form.initial_balance.trim()) nextErrors.initial_balance = ['Enter an opening balance.']
        if (!/^[A-Za-z]{3}$/.test(form.currency)) {
            nextErrors.currency = ['Use a three-letter currency code.']
        }
        if (!Number.isSafeInteger(amount)) nextErrors.initial_balance = ['Enter a whole number.']

        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors)
            return
        }

        setSaving(true)
        try {
            const payload = {
                name: form.name.trim(),
                type: form.type,
                currency: form.currency.toUpperCase(),
                initial_balance: amount,
                is_active: form.is_active,
            }
            await apiRequest<Account>(editing ? `/accounts/${editing.id}` : '/accounts', {
                method: editing ? 'PUT' : 'POST',
                body: payload,
            })
            closeForm()
            showToast(editing ? 'Account updated.' : 'Account created.')
            await accounts.reload()
        } catch (error) {
            setFormError(getErrorMessage(error, 'Unable to save the account.'))
            setFieldErrors(getFieldErrors(error))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await apiRequest(`/accounts/${deleteTarget.id}`, { method: 'DELETE' })
            setDeleteTarget(null)
            showToast('Account deleted.')
            await accounts.reload()
        } catch (error) {
            showToast(getErrorMessage(error, 'Unable to delete the account.'), 'error')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="page-stack">
            <PageHeader
                eyebrow="Workspace"
                title="Accounts"
                description="Keep the places where you hold money visible and organized."
                action={
                    <Button onClick={openCreate} icon={<Plus size={17} aria-hidden="true" />}>
                        Add account
                    </Button>
                }
            />

            <section className="surface">
                <div className="toolbar">
                    <div className="search-field">
                        <Search size={17} aria-hidden="true" />
                        <label className="sr-only" htmlFor="account-search">Search accounts</label>
                        <input
                            id="account-search"
                            type="search"
                            placeholder="Search accounts"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <div className="filter-group" aria-label="Filter accounts">
                        {(['all', 'active', 'inactive'] as const).map((filter) => (
                            <button
                                type="button"
                                key={filter}
                                className={`filter-button ${statusFilter === filter ? 'selected' : ''}`}
                                onClick={() => setStatusFilter(filter)}
                            >
                                {titleCase(filter)}
                            </button>
                        ))}
                    </div>
                </div>

                {accounts.isLoading ? (
                    <LoadingState label="Loading accounts" />
                ) : accounts.error ? (
                    <ErrorState
                        message="We could not load your accounts."
                        onRetry={() => void accounts.reload()}
                    />
                ) : filteredAccounts.length === 0 ? (
                    <EmptyState
                        title={(accounts.data || []).length === 0 ? 'No accounts yet' : 'No matching accounts'}
                        description={
                            (accounts.data || []).length === 0
                                ? 'Add an account to start tracking your money.'
                                : 'Try a different search or status filter.'
                        }
                        action={
                            (accounts.data || []).length === 0 ? (
                                <Button size="sm" onClick={openCreate}>
                                    Add your first account
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <DataTable
                        rows={filteredAccounts}
                        rowKey={(account) => account.id}
                        columns={[
                            {
                                key: 'name',
                                header: 'Account',
                                render: (account) => (
                                    <div className="primary-cell">
                                        <span className="row-icon"><WalletCards size={17} aria-hidden="true" /></span>
                                        <span><strong>{account.name}</strong><small>Added {formatDate(account.created_at)}</small></span>
                                    </div>
                                ),
                            },
                            { key: 'type', header: 'Type', render: (account) => titleCase(account.type) },
                            { key: 'currency', header: 'Currency', render: (account) => account.currency },
                            {
                                key: 'balance',
                                header: 'Opening balance',
                                align: 'right',
                                render: (account) => <strong>{formatMoney(account.initial_balance, account.currency)}</strong>,
                            },
                            {
                                key: 'status',
                                header: 'Status',
                                render: (account) => (
                                    <StatusBadge tone={account.is_active ? 'positive' : 'neutral'}>
                                        {account.is_active ? 'Active' : 'Inactive'}
                                    </StatusBadge>
                                ),
                            },
                            {
                                key: 'actions',
                                header: <span className="sr-only">Actions</span>,
                                align: 'right',
                                render: (account) => (
                                    <div className="row-actions">
                                        <button type="button" className="icon-button" onClick={() => openEdit(account)} aria-label={`Edit ${account.name}`}>
                                            <Pencil size={16} aria-hidden="true" />
                                        </button>
                                        <button type="button" className="icon-button danger-icon" onClick={() => setDeleteTarget(account)} aria-label={`Delete ${account.name}`}>
                                            <Trash2 size={16} aria-hidden="true" />
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        mobile={(account) => (
                            <div className="mobile-record">
                                <div className="mobile-record-header">
                                    <div className="primary-cell">
                                        <span className="row-icon"><WalletCards size={17} aria-hidden="true" /></span>
                                        <span><strong>{account.name}</strong><small>{titleCase(account.type)} · {account.currency}</small></span>
                                    </div>
                                    <StatusBadge tone={account.is_active ? 'positive' : 'neutral'}>{account.is_active ? 'Active' : 'Inactive'}</StatusBadge>
                                </div>
                                <div className="mobile-record-footer">
                                    <span>Opening balance</span>
                                    <strong>{formatMoney(account.initial_balance, account.currency)}</strong>
                                </div>
                                <div className="mobile-record-actions">
                                    <Button size="sm" variant="secondary" onClick={() => openEdit(account)} icon={<Pencil size={15} aria-hidden="true" />}>Edit</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(account)} icon={<Trash2 size={15} aria-hidden="true" />}>Delete</Button>
                                </div>
                            </div>
                        )}
                    />
                )}
            </section>

            <Modal
                open={formOpen}
                title={editing ? 'Edit account' : 'Add account'}
                description={editing ? 'Update the account details below.' : 'Create an account to hold your money.'}
                onClose={closeForm}
            >
                {formError ? <div className="form-alert" role="alert">{formError}</div> : null}
                <form className="form-stack" onSubmit={handleSubmit} noValidate>
                    <Field label="Account name" error={fieldErrors.name?.[0]} required>
                        {(props) => <input {...props} type="text" placeholder="e.g. Everyday checking" value={form.name} onChange={(event) => updateForm('name', event.target.value)} />}
                    </Field>
                    <div className="form-grid-two">
                        <Field label="Account type" error={fieldErrors.type?.[0]} required>
                            {(props) => (
                                <select {...props} value={form.type} onChange={(event) => updateForm('type', event.target.value)}>
                                    {accountTypeOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                                    {!accountTypeOptions.some((option) => option.value === form.type) ? <option value={form.type}>{titleCase(form.type)}</option> : null}
                                </select>
                            )}
                        </Field>
                        <Field label="Currency" error={fieldErrors.currency?.[0]} hint="Three-letter code, such as IDR or USD." required>
                            {(props) => <input {...props} type="text" maxLength={3} value={form.currency} onChange={(event) => updateForm('currency', event.target.value.toUpperCase())} />}
                        </Field>
                    </div>
                    <Field label="Opening balance" error={fieldErrors.initial_balance?.[0]} hint="Whole units only; no decimal currency values are sent." required>
                        {(props) => <input {...props} type="number" step="1" value={form.initial_balance} onChange={(event) => updateForm('initial_balance', event.target.value)} />}
                    </Field>
                    <CheckboxField label="Account is active" checked={form.is_active} onChange={(value) => updateForm('is_active', value)} hint="Inactive accounts remain saved but are marked as unavailable." />
                    <div className="modal-actions">
                        <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
                        <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create account'}</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Delete account?"
                description={`This will permanently remove ${deleteTarget?.name || 'this account'}. Related records may also be removed by the API.`}
                loading={deleting}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={() => void handleDelete()}
            />
        </div>
    )
}
