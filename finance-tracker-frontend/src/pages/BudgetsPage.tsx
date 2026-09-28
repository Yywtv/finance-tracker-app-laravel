import { useMemo, useState, type FormEvent } from 'react'
import { BarChart3, Pencil, Plus, Trash2 } from 'lucide-react'
import { apiRequest, getErrorMessage, getFieldErrors } from '../lib/api'
import { budgetPeriodOptions, optionLabel } from '../lib/constants'
import { formatDate, formatMoney, todayInputValue } from '../lib/format'
import { useApiResource } from '../hooks/useApiResource'
import { useToast } from '../components/Toast'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { ConfirmDialog, Modal } from '../components/Modal'
import { DataTable } from '../components/DataTable'
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import type { ApiFieldErrors, Budget, BudgetPeriod, Category } from '../types'

interface BudgetFormState {
    category_id: string
    amount: string
    period: BudgetPeriod
    start_date: string
    end_date: string
}

function emptyForm(): BudgetFormState {
    return {
        category_id: '',
        amount: '',
        period: 'monthly',
        start_date: todayInputValue(),
        end_date: '',
    }
}

function toForm(budget: Budget): BudgetFormState {
    return {
        category_id: String(budget.category_id),
        amount: String(budget.amount),
        period: budget.period,
        start_date: budget.start_date,
        end_date: budget.end_date || '',
    }
}

export function BudgetsPage() {
    const { showToast } = useToast()
    const budgets = useApiResource<Budget[]>('/budgets')
    const categories = useApiResource<Category[]>('/categories')
    const [periodFilter, setPeriodFilter] = useState<'all' | BudgetPeriod>('all')
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Budget | null>(null)
    const [form, setForm] = useState<BudgetFormState>(emptyForm)
    const [formError, setFormError] = useState('')
    const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null)
    const [deleting, setDeleting] = useState(false)

    const categoryMap = useMemo(
        () => new Map((categories.data || []).map((category) => [category.id, category])),
        [categories.data],
    )
    const rows = (budgets.data || []).filter(
        (budget) => periodFilter === 'all' || budget.period === periodFilter,
    )

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm())
        setFieldErrors({})
        setFormError('')
        setFormOpen(true)
    }

    const openEdit = (budget: Budget) => {
        setEditing(budget)
        setForm(toForm(budget))
        setFieldErrors({})
        setFormError('')
        setFormOpen(true)
    }

    const updateForm = <K extends keyof BudgetFormState>(key: K, value: BudgetFormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }))
        setFieldErrors((current) => ({ ...current, [key]: '' }))
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFormError('')
        setFieldErrors({})
        const amount = Number(form.amount)
        const nextErrors: ApiFieldErrors = {}
        if (!form.category_id) nextErrors.category_id = ['Choose a category.']
        if (!Number.isSafeInteger(amount) || amount < 1) nextErrors.amount = ['Enter a whole number greater than zero.']
        if (!form.start_date) nextErrors.start_date = ['Choose a start date.']
        if (form.end_date && form.start_date && form.end_date < form.start_date) nextErrors.end_date = ['End date must be on or after the start date.']
        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors)
            return
        }

        setSaving(true)
        try {
            const payload = {
                category_id: Number(form.category_id),
                amount,
                period: form.period,
                start_date: form.start_date,
                end_date: form.end_date || null,
            }
            await apiRequest<Budget>(editing ? `/budgets/${editing.id}` : '/budgets', {
                method: editing ? 'PUT' : 'POST',
                body: payload,
            })
            setFormOpen(false)
            showToast(editing ? 'Budget updated.' : 'Budget created.')
            await budgets.reload()
        } catch (error) {
            setFormError(getErrorMessage(error, 'Unable to save the budget.'))
            setFieldErrors(getFieldErrors(error))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await apiRequest(`/budgets/${deleteTarget.id}`, { method: 'DELETE' })
            setDeleteTarget(null)
            showToast('Budget deleted.')
            await budgets.reload()
        } catch (error) {
            showToast(getErrorMessage(error, 'Unable to delete the budget.'), 'error')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="page-stack">
            <PageHeader eyebrow="Workspace" title="Budgets" description="Set clear limits for the categories you want to keep in check." action={<Button onClick={openCreate} icon={<Plus size={17} aria-hidden="true" />}>Add budget</Button>} />
            <div className="info-banner"><BarChart3 size={18} aria-hidden="true" /><span>Budgets shown here are the limits stored by the API. The backend does not currently return category spending totals or remaining amounts.</span></div>

            <section className="surface">
                <div className="toolbar"><div className="toolbar-summary"><strong>{budgets.data?.length ?? 0}</strong><span>budget definitions</span></div><div className="filter-group" aria-label="Filter budgets">{(['all', 'weekly', 'monthly', 'yearly'] as const).map((period) => <button type="button" key={period} className={`filter-button ${periodFilter === period ? 'selected' : ''}`} onClick={() => setPeriodFilter(period)}>{period === 'all' ? 'All' : optionLabel(budgetPeriodOptions, period)}</button>)}</div></div>
                {budgets.isLoading ? <LoadingState label="Loading budgets" /> : budgets.error ? <ErrorState message="We could not load budgets." onRetry={() => void budgets.reload()} /> : rows.length === 0 ? <EmptyState title={(budgets.data || []).length === 0 ? 'No budgets yet' : 'No budgets in this period'} description={(budgets.data || []).length === 0 ? 'Create a budget to define a limit for a category.' : 'Try another period filter.'} action={(budgets.data || []).length === 0 ? <Button size="sm" onClick={openCreate}>Create a budget</Button> : undefined} /> : (
                    <DataTable
                        rows={rows}
                        rowKey={(budget) => budget.id}
                        columns={[
                            { key: 'category', header: 'Category', render: (budget) => <div className="primary-cell"><span className="row-icon"><BarChart3 size={17} aria-hidden="true" /></span><span><strong>{categoryMap.get(budget.category_id)?.name || 'Unknown category'}</strong><small>{categoryMap.get(budget.category_id)?.type || '—'}</small></span></div> },
                            { key: 'period', header: 'Period', render: (budget) => <StatusBadge tone="info">{optionLabel(budgetPeriodOptions, budget.period)}</StatusBadge> },
                            { key: 'amount', header: 'Budget limit', align: 'right', render: (budget) => <strong>{formatMoney(budget.amount)}</strong> },
                            { key: 'dates', header: 'Dates', render: (budget) => `${formatDate(budget.start_date)} – ${budget.end_date ? formatDate(budget.end_date) : 'Ongoing'}` },
                            { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (budget) => <div className="row-actions"><button type="button" className="icon-button" onClick={() => openEdit(budget)} aria-label="Edit budget"><Pencil size={16} aria-hidden="true" /></button><button type="button" className="icon-button danger-icon" onClick={() => setDeleteTarget(budget)} aria-label="Delete budget"><Trash2 size={16} aria-hidden="true" /></button></div> },
                        ]}
                        mobile={(budget) => <div className="mobile-record"><div className="mobile-record-header"><div className="primary-cell"><span className="row-icon"><BarChart3 size={17} aria-hidden="true" /></span><span><strong>{categoryMap.get(budget.category_id)?.name || 'Unknown category'}</strong><small>{optionLabel(budgetPeriodOptions, budget.period)}</small></span></div><strong>{formatMoney(budget.amount)}</strong></div><div className="mobile-record-footer"><span>{formatDate(budget.start_date)} – {budget.end_date ? formatDate(budget.end_date) : 'Ongoing'}</span></div><div className="mobile-record-actions"><Button size="sm" variant="secondary" onClick={() => openEdit(budget)} icon={<Pencil size={15} aria-hidden="true" />}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDeleteTarget(budget)} icon={<Trash2 size={15} aria-hidden="true" />}>Delete</Button></div></div>}
                    />
                )}
            </section>

            <Modal open={formOpen} title={editing ? 'Edit budget' : 'Add budget'} description={editing ? 'Update the budget definition below.' : 'Set a limit and period for a category.'} onClose={() => setFormOpen(false)}>
                {formError ? <div className="form-alert" role="alert">{formError}</div> : null}
                <form className="form-stack" onSubmit={handleSubmit} noValidate>
                    <Field label="Category" error={fieldErrors.category_id?.[0]} required>{(props) => <select {...props} value={form.category_id} onChange={(event) => updateForm('category_id', event.target.value)}><option value="">Select a category</option>{(categories.data || []).map((category) => <option key={category.id} value={category.id}>{category.name} ({category.type})</option>)}</select>}</Field>
                    <div className="form-grid-two"><Field label="Budget limit" error={fieldErrors.amount?.[0]} hint="Whole currency units only." required>{(props) => <input {...props} type="number" min="1" step="1" inputMode="numeric" placeholder="0" value={form.amount} onChange={(event) => updateForm('amount', event.target.value)} />}</Field><Field label="Period" error={fieldErrors.period?.[0]} required>{(props) => <select {...props} value={form.period} onChange={(event) => updateForm('period', event.target.value as BudgetPeriod)}>{budgetPeriodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}</Field></div>
                    <div className="form-grid-two"><Field label="Start date" error={fieldErrors.start_date?.[0]} required>{(props) => <input {...props} type="date" value={form.start_date} onChange={(event) => updateForm('start_date', event.target.value)} />}</Field><Field label="End date" error={fieldErrors.end_date?.[0]} hint="Leave blank for an open-ended budget.">{(props) => <input {...props} type="date" value={form.end_date} onChange={(event) => updateForm('end_date', event.target.value)} />}</Field></div>
                    <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create budget'}</Button></div>
                </form>
            </Modal>
            <ConfirmDialog open={Boolean(deleteTarget)} title="Delete budget?" description="This will permanently remove the selected budget definition." loading={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={() => void handleDelete()} />
        </div>
    )
}
