import { useMemo, useState, type FormEvent } from 'react'
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react'
import { apiRequest, getErrorMessage, getFieldErrors } from '../lib/api'
import { optionLabel, recurringFrequencyOptions } from '../lib/constants'
import { formatDate, formatMoney, todayInputValue } from '../lib/format'
import { useApiResource } from '../hooks/useApiResource'
import { useToast } from '../components/Toast'
import { Button } from '../components/Button'
import { CheckboxField, Field } from '../components/Field'
import { ConfirmDialog, Modal } from '../components/Modal'
import { DataTable } from '../components/DataTable'
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import type { Account, ApiFieldErrors, RecurringFrequency, RecurringTransfer } from '../types'

interface RecurringFormState {
    from_account_id: string
    to_account_id: string
    amount: string
    frequency: RecurringFrequency
    next_occurrence: string
    start_date: string
    end_date: string
    is_active: boolean
}

function emptyForm(): RecurringFormState {
    const today = todayInputValue()
    return {
        from_account_id: '',
        to_account_id: '',
        amount: '',
        frequency: 'monthly',
        next_occurrence: today,
        start_date: today,
        end_date: '',
        is_active: true,
    }
}

function toForm(item: RecurringTransfer): RecurringFormState {
    return {
        from_account_id: String(item.from_account_id),
        to_account_id: String(item.to_account_id),
        amount: String(item.amount),
        frequency: item.frequency,
        next_occurrence: item.next_occurrence,
        start_date: item.start_date,
        end_date: item.end_date || '',
        is_active: item.is_active,
    }
}

export function RecurringTransfersPage() {
    const { showToast } = useToast()
    const recurring = useApiResource<RecurringTransfer[]>('/recurring-transfers')
    const accounts = useApiResource<Account[]>('/accounts')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<RecurringTransfer | null>(null)
    const [form, setForm] = useState<RecurringFormState>(emptyForm)
    const [formError, setFormError] = useState('')
    const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<RecurringTransfer | null>(null)
    const [deleting, setDeleting] = useState(false)

    const accountMap = useMemo(
        () => new Map((accounts.data || []).map((account) => [account.id, account])),
        [accounts.data],
    )
    const rows = (recurring.data || []).filter((item) => statusFilter === 'all' || (statusFilter === 'active' ? item.is_active : !item.is_active))
    const accountOptions = (accounts.data || []).filter((account) => account.is_active)

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm())
        setFieldErrors({})
        setFormError('')
        setFormOpen(true)
    }

    const openEdit = (item: RecurringTransfer) => {
        setEditing(item)
        setForm(toForm(item))
        setFieldErrors({})
        setFormError('')
        setFormOpen(true)
    }

    const updateForm = <K extends keyof RecurringFormState>(key: K, value: RecurringFormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }))
        setFieldErrors((current) => ({ ...current, [key]: '' }))
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFormError('')
        setFieldErrors({})
        const amount = Number(form.amount)
        const nextErrors: ApiFieldErrors = {}
        if (!form.from_account_id) nextErrors.from_account_id = ['Choose a source account.']
        if (!form.to_account_id) nextErrors.to_account_id = ['Choose a destination account.']
        if (form.from_account_id && form.from_account_id === form.to_account_id) nextErrors.to_account_id = ['Choose a different destination account.']
        if (!Number.isSafeInteger(amount) || amount < 1) nextErrors.amount = ['Enter a whole number greater than zero.']
        if (!form.next_occurrence) nextErrors.next_occurrence = ['Choose the next occurrence date.']
        if (!form.start_date) nextErrors.start_date = ['Choose a start date.']
        if (form.end_date && form.start_date && form.end_date < form.start_date) nextErrors.end_date = ['End date must be on or after the start date.']
        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors)
            return
        }

        setSaving(true)
        try {
            const payload = {
                from_account_id: Number(form.from_account_id),
                to_account_id: Number(form.to_account_id),
                amount,
                frequency: form.frequency,
                next_occurrence: form.next_occurrence,
                start_date: form.start_date,
                end_date: form.end_date || null,
                is_active: form.is_active,
            }
            await apiRequest<RecurringTransfer>(editing ? `/recurring-transfers/${editing.id}` : '/recurring-transfers', {
                method: editing ? 'PUT' : 'POST',
                body: payload,
            })
            setFormOpen(false)
            showToast(editing ? 'Recurring transfer updated.' : 'Recurring transfer created.')
            await recurring.reload()
        } catch (error) {
            setFormError(getErrorMessage(error, 'Unable to save the recurring transfer.'))
            setFieldErrors(getFieldErrors(error))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await apiRequest(`/recurring-transfers/${deleteTarget.id}`, { method: 'DELETE' })
            setDeleteTarget(null)
            showToast('Recurring transfer deleted.')
            await recurring.reload()
        } catch (error) {
            showToast(getErrorMessage(error, 'Unable to delete the recurring transfer.'), 'error')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="page-stack">
            <PageHeader eyebrow="Planning" title="Recurring transfers" description="Keep planned movements between accounts visible and up to date." action={<Button onClick={openCreate} icon={<Plus size={17} aria-hidden="true" />}>Add recurring transfer</Button>} />
            <div className="info-banner"><CalendarClock size={18} aria-hidden="true" /><span>This API stores recurring transfer definitions and next occurrence dates. It does not run a scheduler or create transfer records automatically.</span></div>

            <section className="surface">
                <div className="toolbar"><div className="toolbar-summary"><strong>{recurring.data?.length ?? 0}</strong><span>definitions</span></div><div className="filter-group" aria-label="Filter recurring transfers">{(['all', 'active', 'inactive'] as const).map((status) => <button type="button" key={status} className={`filter-button ${statusFilter === status ? 'selected' : ''}`} onClick={() => setStatusFilter(status)}>{status[0].toUpperCase() + status.slice(1)}</button>)}</div></div>
                {recurring.isLoading ? <LoadingState label="Loading recurring transfers" /> : recurring.error ? <ErrorState message="We could not load recurring transfers." onRetry={() => void recurring.reload()} /> : rows.length === 0 ? <EmptyState title={(recurring.data || []).length === 0 ? 'No recurring transfers yet' : 'No transfers in this status'} description={(recurring.data || []).length === 0 ? 'Create a definition for a transfer you plan to repeat.' : 'Try another status filter.'} action={(recurring.data || []).length === 0 ? <Button size="sm" onClick={openCreate}>Create a recurring transfer</Button> : undefined} /> : (
                    <DataTable
                        rows={rows}
                        rowKey={(item) => item.id}
                        columns={[
                            { key: 'route', header: 'Route', render: (item) => <div className="route-cell"><span>{accountMap.get(item.from_account_id)?.name || 'Unknown'}</span><span className="route-arrow">→</span><span>{accountMap.get(item.to_account_id)?.name || 'Unknown'}</span></div> },
                            { key: 'amount', header: 'Amount', align: 'right', render: (item) => <strong>{formatMoney(item.amount, accountMap.get(item.from_account_id)?.currency)}</strong> },
                            { key: 'frequency', header: 'Frequency', render: (item) => <StatusBadge tone="info">{optionLabel(recurringFrequencyOptions, item.frequency)}</StatusBadge> },
                            { key: 'next', header: 'Next occurrence', render: (item) => formatDate(item.next_occurrence) },
                            { key: 'status', header: 'Status', render: (item) => <StatusBadge tone={item.is_active ? 'positive' : 'neutral'}>{item.is_active ? 'Active' : 'Paused'}</StatusBadge> },
                            { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (item) => <div className="row-actions"><button type="button" className="icon-button" onClick={() => openEdit(item)} aria-label="Edit recurring transfer"><Pencil size={16} aria-hidden="true" /></button><button type="button" className="icon-button danger-icon" onClick={() => setDeleteTarget(item)} aria-label="Delete recurring transfer"><Trash2 size={16} aria-hidden="true" /></button></div> },
                        ]}
                        mobile={(item) => <div className="mobile-record"><div className="mobile-record-header"><div><strong>{accountMap.get(item.from_account_id)?.name || 'Unknown'} → {accountMap.get(item.to_account_id)?.name || 'Unknown'}</strong><small>{optionLabel(recurringFrequencyOptions, item.frequency)} · Next {formatDate(item.next_occurrence)}</small></div><strong>{formatMoney(item.amount, accountMap.get(item.from_account_id)?.currency)}</strong></div><div className="mobile-record-footer"><StatusBadge tone={item.is_active ? 'positive' : 'neutral'}>{item.is_active ? 'Active' : 'Paused'}</StatusBadge><span>Ends {item.end_date ? formatDate(item.end_date) : 'ongoing'}</span></div><div className="mobile-record-actions"><Button size="sm" variant="secondary" onClick={() => openEdit(item)} icon={<Pencil size={15} aria-hidden="true" />}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDeleteTarget(item)} icon={<Trash2 size={15} aria-hidden="true" />}>Delete</Button></div></div>}
                    />
                )}
            </section>

            <Modal open={formOpen} title={editing ? 'Edit recurring transfer' : 'Add recurring transfer'} description={editing ? 'Update the recurring definition below.' : 'Define a planned movement and its next occurrence.'} onClose={() => setFormOpen(false)} size="lg">
                {formError ? <div className="form-alert" role="alert">{formError}</div> : null}
                <form className="form-stack" onSubmit={handleSubmit} noValidate>
                    <div className="form-grid-two"><Field label="From account" error={fieldErrors.from_account_id?.[0]} required>{(props) => <select {...props} value={form.from_account_id} onChange={(event) => updateForm('from_account_id', event.target.value)}><option value="">Select source</option>{accountOptions.map((account) => <option key={account.id} value={account.id}>{account.name} ({account.currency})</option>)}</select>}</Field><Field label="To account" error={fieldErrors.to_account_id?.[0]} required>{(props) => <select {...props} value={form.to_account_id} onChange={(event) => updateForm('to_account_id', event.target.value)}><option value="">Select destination</option>{accountOptions.filter((account) => String(account.id) !== form.from_account_id).map((account) => <option key={account.id} value={account.id}>{account.name} ({account.currency})</option>)}</select>}</Field></div>
                    <div className="form-grid-two"><Field label="Amount" error={fieldErrors.amount?.[0]} hint="Whole currency units only." required>{(props) => <input {...props} type="number" min="1" step="1" inputMode="numeric" placeholder="0" value={form.amount} onChange={(event) => updateForm('amount', event.target.value)} />}</Field><Field label="Frequency" error={fieldErrors.frequency?.[0]} required>{(props) => <select {...props} value={form.frequency} onChange={(event) => updateForm('frequency', event.target.value as RecurringFrequency)}>{recurringFrequencyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}</Field></div>
                    <div className="form-grid-three"><Field label="Start date" error={fieldErrors.start_date?.[0]} required>{(props) => <input {...props} type="date" value={form.start_date} onChange={(event) => updateForm('start_date', event.target.value)} />}</Field><Field label="Next occurrence" error={fieldErrors.next_occurrence?.[0]} required>{(props) => <input {...props} type="date" value={form.next_occurrence} onChange={(event) => updateForm('next_occurrence', event.target.value)} />}</Field><Field label="End date" error={fieldErrors.end_date?.[0]} hint="Optional.">{(props) => <input {...props} type="date" value={form.end_date} onChange={(event) => updateForm('end_date', event.target.value)} />}</Field></div>
                    <CheckboxField label="Definition is active" checked={form.is_active} onChange={(value) => updateForm('is_active', value)} hint="Inactive definitions remain saved but are marked as paused." />
                    <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create definition'}</Button></div>
                </form>
            </Modal>
            <ConfirmDialog open={Boolean(deleteTarget)} title="Delete recurring transfer?" description="This will permanently remove the selected recurring definition." loading={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={() => void handleDelete()} />
        </div>
    )
}
