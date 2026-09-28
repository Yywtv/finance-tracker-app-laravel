import { useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, Filter, Pencil, Plus, Trash2, X } from 'lucide-react'
import { apiRequest, getErrorMessage, getFieldErrors, queryString } from '../lib/api'
import { formatDate, formatMoney, formatNumber, todayInputValue } from '../lib/format'
import { useApiResource } from '../hooks/useApiResource'
import { useToast } from '../components/Toast'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { ConfirmDialog, Modal } from '../components/Modal'
import { DataTable } from '../components/DataTable'
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback'
import { PageHeader } from '../components/PageHeader'
import { Pagination } from '../components/Pagination'
import type { Account, ApiFieldErrors, PaginatedResponse, Transfer } from '../types'

interface TransferFilters {
    from_account_id: string
    to_account_id: string
    from: string
    to: string
}

interface TransferFormState {
    from_account_id: string
    to_account_id: string
    amount: string
    transfer_date: string
    description: string
}

const emptyFilters: TransferFilters = {
    from_account_id: '',
    to_account_id: '',
    from: '',
    to: '',
}

function emptyForm(): TransferFormState {
    return {
        from_account_id: '',
        to_account_id: '',
        amount: '',
        transfer_date: todayInputValue(),
        description: '',
    }
}

function toForm(transfer: Transfer): TransferFormState {
    return {
        from_account_id: String(transfer.from_account_id),
        to_account_id: String(transfer.to_account_id),
        amount: String(transfer.amount),
        transfer_date: transfer.transfer_date,
        description: transfer.description || '',
    }
}

export function TransfersPage() {
    const { showToast } = useToast()
    const accounts = useApiResource<Account[]>('/accounts')
    const [draftFilters, setDraftFilters] = useState(emptyFilters)
    const [filters, setFilters] = useState(emptyFilters)
    const [page, setPage] = useState(1)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Transfer | null>(null)
    const [form, setForm] = useState<TransferFormState>(emptyForm)
    const [formError, setFormError] = useState('')
    const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Transfer | null>(null)
    const [deleting, setDeleting] = useState(false)

    const transferPath = `/transfers${queryString({
        ...filters,
        page: page > 1 ? page : undefined,
    })}`
    const transfers = useApiResource<PaginatedResponse<Transfer>>(transferPath)
    const accountMap = useMemo(
        () => new Map((accounts.data || []).map((account) => [account.id, account])),
        [accounts.data],
    )
    const rows = transfers.data?.data || []
    const hasActiveFilters = Object.values(filters).some(Boolean)

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm())
        setFieldErrors({})
        setFormError('')
        setFormOpen(true)
    }

    const openEdit = (transfer: Transfer) => {
        setEditing(transfer)
        setForm(toForm(transfer))
        setFieldErrors({})
        setFormError('')
        setFormOpen(true)
    }

    const updateForm = <K extends keyof TransferFormState>(key: K, value: TransferFormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }))
        setFieldErrors((current) => ({ ...current, [key]: '' }))
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
        if (!form.from_account_id) nextErrors.from_account_id = ['Choose a source account.']
        if (!form.to_account_id) nextErrors.to_account_id = ['Choose a destination account.']
        if (form.from_account_id && form.from_account_id === form.to_account_id) {
            nextErrors.to_account_id = ['Choose a different destination account.']
        }
        if (!form.transfer_date) nextErrors.transfer_date = ['Choose a date.']
        if (!Number.isSafeInteger(amount) || amount < 1) nextErrors.amount = ['Enter a whole number greater than zero.']

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
                transfer_date: form.transfer_date,
                description: form.description.trim() || null,
            }
            await apiRequest<Transfer>(editing ? `/transfers/${editing.id}` : '/transfers', {
                method: editing ? 'PUT' : 'POST',
                body: payload,
            })
            setFormOpen(false)
            showToast(editing ? 'Transfer updated.' : 'Transfer recorded.')
            await transfers.reload()
        } catch (error) {
            setFormError(getErrorMessage(error, 'Unable to save the transfer.'))
            setFieldErrors(getFieldErrors(error))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await apiRequest(`/transfers/${deleteTarget.id}`, { method: 'DELETE' })
            setDeleteTarget(null)
            showToast('Transfer deleted.')
            await transfers.reload()
        } catch (error) {
            showToast(getErrorMessage(error, 'Unable to delete the transfer.'), 'error')
        } finally {
            setDeleting(false)
        }
    }

    const accountOptions = (accounts.data || []).filter((account) => account.is_active)

    return (
        <div className="page-stack">
            <PageHeader eyebrow="Workspace" title="Transfers" description="Record movements between your own accounts." action={<Button onClick={openCreate} icon={<Plus size={17} aria-hidden="true" />}>Add transfer</Button>} />
            <div className="info-banner"><ArrowRight size={18} aria-hidden="true" /><span>Transfers are stored as their own records. The current API does not apply them to account balances or the dashboard total.</span></div>

            <section className="surface">
                <div className="toolbar toolbar-wrap">
                    <div className="toolbar-summary"><strong>{transfers.data?.total ?? 0}</strong><span>transfers</span></div>
                    <div className="toolbar-actions">
                        <Button variant={filtersOpen || hasActiveFilters ? 'secondary' : 'ghost'} onClick={() => setFiltersOpen((current) => !current)} icon={<Filter size={16} aria-hidden="true" />}>Filters{hasActiveFilters ? ' · active' : ''}</Button>
                        {hasActiveFilters ? <Button variant="ghost" onClick={resetFilters} icon={<X size={15} aria-hidden="true" />}>Reset</Button> : null}
                    </div>
                </div>

                {filtersOpen ? (
                    <div className="filter-panel">
                        <div className="form-grid-two">
                            <Field label="From account">{(props) => <select {...props} value={draftFilters.from_account_id} onChange={(event) => setDraftFilters((current) => ({ ...current, from_account_id: event.target.value }))}><option value="">All source accounts</option>{accountOptions.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select>}</Field>
                            <Field label="To account">{(props) => <select {...props} value={draftFilters.to_account_id} onChange={(event) => setDraftFilters((current) => ({ ...current, to_account_id: event.target.value }))}><option value="">All destination accounts</option>{accountOptions.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select>}</Field>
                        </div>
                        <div className="form-grid-two">
                            <Field label="From date">{(props) => <input {...props} type="date" value={draftFilters.from} onChange={(event) => setDraftFilters((current) => ({ ...current, from: event.target.value }))} />}</Field>
                            <Field label="To date">{(props) => <input {...props} type="date" value={draftFilters.to} onChange={(event) => setDraftFilters((current) => ({ ...current, to: event.target.value }))} />}</Field>
                        </div>
                        <div className="filter-actions"><Button size="sm" onClick={applyFilters}>Apply filters</Button></div>
                    </div>
                ) : null}

                {accounts.error ? <ErrorState message="Account options could not be loaded." onRetry={() => void accounts.reload()} /> : null}
                {transfers.isLoading ? <LoadingState label="Loading transfers" /> : transfers.error ? <ErrorState message="We could not load transfers." onRetry={() => void transfers.reload()} /> : rows.length === 0 ? (
                    <EmptyState title={hasActiveFilters ? 'No matching transfers' : 'No transfers yet'} description={hasActiveFilters ? 'Try changing or resetting the filters.' : 'Record a transfer when money moves between your accounts.'} action={!hasActiveFilters ? <Button size="sm" onClick={openCreate} icon={<Plus size={15} aria-hidden="true" />}>Add transfer</Button> : undefined} />
                ) : (
                    <>
                        <DataTable
                            rows={rows}
                            rowKey={(transfer) => transfer.id}
                            columns={[
                                { key: 'date', header: 'Date', render: (transfer) => formatDate(transfer.transfer_date) },
                                { key: 'route', header: 'Route', render: (transfer) => <div className="route-cell"><span>{accountMap.get(transfer.from_account_id)?.name || 'Unknown'}</span><ArrowRight size={15} aria-hidden="true" /><span>{accountMap.get(transfer.to_account_id)?.name || 'Unknown'}</span></div> },
                                { key: 'description', header: 'Description', render: (transfer) => transfer.description || <span className="muted-text">No description</span> },
                                { key: 'amount', header: 'Amount', align: 'right', render: (transfer) => { const from = accountMap.get(transfer.from_account_id); const to = accountMap.get(transfer.to_account_id); return <strong>{from?.currency === to?.currency ? formatMoney(transfer.amount, from?.currency) : formatNumber(transfer.amount)}</strong>; } },
                                { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (transfer) => <div className="row-actions"><button type="button" className="icon-button" onClick={() => openEdit(transfer)} aria-label="Edit transfer"><Pencil size={16} aria-hidden="true" /></button><button type="button" className="icon-button danger-icon" onClick={() => setDeleteTarget(transfer)} aria-label="Delete transfer"><Trash2 size={16} aria-hidden="true" /></button></div> },
                            ]}
                            mobile={(transfer) => {
                                const from = accountMap.get(transfer.from_account_id)
                                const to = accountMap.get(transfer.to_account_id)
                                return <div className="mobile-record"><div className="mobile-record-header"><div><strong>{transfer.description || 'Transfer'}</strong><small>{formatDate(transfer.transfer_date)}</small></div><strong>{from?.currency === to?.currency ? formatMoney(transfer.amount, from?.currency) : formatNumber(transfer.amount)}</strong></div><div className="transfer-mobile-route"><span>{from?.name || 'Unknown'}</span><ArrowRight size={15} aria-hidden="true" /><span>{to?.name || 'Unknown'}</span></div><div className="mobile-record-actions"><Button size="sm" variant="secondary" onClick={() => openEdit(transfer)} icon={<Pencil size={15} aria-hidden="true" />}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDeleteTarget(transfer)} icon={<Trash2 size={15} aria-hidden="true" />}>Delete</Button></div></div>
                            }}
                        />
                        <Pagination currentPage={transfers.data?.current_page || page} lastPage={transfers.data?.last_page || 1} total={transfers.data?.total || 0} onPageChange={setPage} />
                    </>
                )}
            </section>

            <Modal open={formOpen} title={editing ? 'Edit transfer' : 'Add transfer'} description={editing ? 'Update the transfer details below.' : 'Move funds between two different accounts.'} onClose={() => setFormOpen(false)}>
                {formError ? <div className="form-alert" role="alert">{formError}</div> : null}
                <form className="form-stack" onSubmit={handleSubmit} noValidate>
                    <div className="form-grid-two">
                        <Field label="From account" error={fieldErrors.from_account_id?.[0]} required>{(props) => <select {...props} value={form.from_account_id} onChange={(event) => updateForm('from_account_id', event.target.value)}><option value="">Select source</option>{accountOptions.map((account) => <option key={account.id} value={account.id}>{account.name} ({account.currency})</option>)}</select>}</Field>
                        <Field label="To account" error={fieldErrors.to_account_id?.[0]} required>{(props) => <select {...props} value={form.to_account_id} onChange={(event) => updateForm('to_account_id', event.target.value)}><option value="">Select destination</option>{accountOptions.filter((account) => String(account.id) !== form.from_account_id).map((account) => <option key={account.id} value={account.id}>{account.name} ({account.currency})</option>)}</select>}</Field>
                    </div>
                    <div className="form-grid-two">
                        <Field label="Amount" error={fieldErrors.amount?.[0]} hint="Whole currency units only." required>{(props) => <input {...props} type="number" min="1" step="1" inputMode="numeric" placeholder="0" value={form.amount} onChange={(event) => updateForm('amount', event.target.value)} />}</Field>
                        <Field label="Date" error={fieldErrors.transfer_date?.[0]} required>{(props) => <input {...props} type="date" value={form.transfer_date} onChange={(event) => updateForm('transfer_date', event.target.value)} />}</Field>
                    </div>
                    <Field label="Description" error={fieldErrors.description?.[0]} hint="Optional note about this transfer.">{(props) => <input {...props} type="text" maxLength={255} placeholder="e.g. Move money to savings" value={form.description} onChange={(event) => updateForm('description', event.target.value)} />}</Field>
                    <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Record transfer'}</Button></div>
                </form>
            </Modal>

            <ConfirmDialog open={Boolean(deleteTarget)} title="Delete transfer?" description="This will permanently remove the selected transfer record." loading={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={() => void handleDelete()} />
        </div>
    )
}
