import { useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { apiRequest, getErrorMessage, getFieldErrors } from '../lib/api'
import { optionLabel, transactionTypeOptions } from '../lib/constants'
import { useApiResource } from '../hooks/useApiResource'
import { useToast } from '../components/Toast'
import { Button } from '../components/Button'
import { CheckboxField, Field } from '../components/Field'
import { ConfirmDialog, Modal } from '../components/Modal'
import { DataTable } from '../components/DataTable'
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import type { ApiFieldErrors, Category, TransactionType } from '../types'

interface CategoryFormState {
    name: string
    type: TransactionType
    icon: string
    color: string
    is_active: boolean
}

const emptyForm: CategoryFormState = {
    name: '',
    type: 'expense',
    icon: '',
    color: '#0f766e',
    is_active: true,
}

export function CategoriesPage() {
    const { showToast } = useToast()
    const categories = useApiResource<Category[]>('/categories')
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Category | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [formError, setFormError] = useState('')
    const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
    const [deleting, setDeleting] = useState(false)

    const filteredCategories = useMemo(() => {
        const query = search.trim().toLowerCase()
        return (categories.data || []).filter((category) => {
            const matchesSearch = !query || category.name.toLowerCase().includes(query)
            const matchesType = typeFilter === 'all' || category.type === typeFilter
            return matchesSearch && matchesType
        })
    }, [categories.data, search, typeFilter])

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm)
        setFieldErrors({})
        setFormError('')
        setFormOpen(true)
    }

    const openEdit = (category: Category) => {
        setEditing(category)
        setForm({
            name: category.name,
            type: category.type,
            icon: category.icon || '',
            color: category.color || '#0f766e',
            is_active: category.is_active,
        })
        setFieldErrors({})
        setFormError('')
        setFormOpen(true)
    }

    const updateForm = <K extends keyof CategoryFormState>(key: K, value: CategoryFormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }))
        setFieldErrors((current) => ({ ...current, [key]: '' }))
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFormError('')
        setFieldErrors({})
        if (!form.name.trim()) {
            setFieldErrors({ name: ['Enter a category name.'] })
            return
        }

        setSaving(true)
        try {
            const payload = {
                name: form.name.trim(),
                type: form.type,
                icon: form.icon.trim() || null,
                color: form.color || null,
                is_active: form.is_active,
            }
            await apiRequest<Category>(editing ? `/categories/${editing.id}` : '/categories', {
                method: editing ? 'PUT' : 'POST',
                body: payload,
            })
            setFormOpen(false)
            showToast(editing ? 'Category updated.' : 'Category created.')
            await categories.reload()
        } catch (error) {
            setFormError(getErrorMessage(error, 'Unable to save the category.'))
            setFieldErrors(getFieldErrors(error))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await apiRequest(`/categories/${deleteTarget.id}`, { method: 'DELETE' })
            setDeleteTarget(null)
            showToast('Category deleted.')
            await categories.reload()
        } catch (error) {
            showToast(getErrorMessage(error, 'Unable to delete the category.'), 'error')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="page-stack">
            <PageHeader
                eyebrow="Workspace"
                title="Categories"
                description="Use clear categories to make transactions easier to understand."
                action={<Button onClick={openCreate} icon={<Plus size={17} aria-hidden="true" />}>Add category</Button>}
            />

            <section className="surface">
                <div className="toolbar">
                    <div className="search-field">
                        <Search size={17} aria-hidden="true" />
                        <label className="sr-only" htmlFor="category-search">Search categories</label>
                        <input id="category-search" type="search" placeholder="Search categories" value={search} onChange={(event) => setSearch(event.target.value)} />
                    </div>
                    <div className="filter-group" aria-label="Filter categories">
                        <button type="button" className={`filter-button ${typeFilter === 'all' ? 'selected' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
                        <button type="button" className={`filter-button ${typeFilter === 'income' ? 'selected' : ''}`} onClick={() => setTypeFilter('income')}>Income</button>
                        <button type="button" className={`filter-button ${typeFilter === 'expense' ? 'selected' : ''}`} onClick={() => setTypeFilter('expense')}>Expense</button>
                    </div>
                </div>

                {categories.isLoading ? (
                    <LoadingState label="Loading categories" />
                ) : categories.error ? (
                    <ErrorState message="We could not load your categories." onRetry={() => void categories.reload()} />
                ) : filteredCategories.length === 0 ? (
                    <EmptyState
                        title={(categories.data || []).length === 0 ? 'No categories yet' : 'No matching categories'}
                        description={(categories.data || []).length === 0 ? 'Add income and expense categories to make your records meaningful.' : 'Try a different search or type filter.'}
                        action={(categories.data || []).length === 0 ? <Button size="sm" onClick={openCreate}>Add your first category</Button> : undefined}
                    />
                ) : (
                    <DataTable
                        rows={filteredCategories}
                        rowKey={(category) => category.id}
                        columns={[
                            {
                                key: 'name',
                                header: 'Category',
                                render: (category) => (
                                    <div className="primary-cell">
                                        <span className="category-swatch" style={{ backgroundColor: category.color || '#94a3b8' }} aria-hidden="true" />
                                        <span><strong>{category.name}</strong><small>{category.icon || 'No icon'}</small></span>
                                    </div>
                                ),
                            },
                            { key: 'type', header: 'Type', render: (category) => <StatusBadge tone={category.type === 'income' ? 'positive' : 'info'}>{optionLabel(transactionTypeOptions, category.type)}</StatusBadge> },
                            { key: 'status', header: 'Status', render: (category) => <StatusBadge tone={category.is_active ? 'positive' : 'neutral'}>{category.is_active ? 'Active' : 'Inactive'}</StatusBadge> },
                            {
                                key: 'actions',
                                header: <span className="sr-only">Actions</span>,
                                align: 'right',
                                render: (category) => (
                                    <div className="row-actions">
                                        <button type="button" className="icon-button" onClick={() => openEdit(category)} aria-label={`Edit ${category.name}`}><Pencil size={16} aria-hidden="true" /></button>
                                        <button type="button" className="icon-button danger-icon" onClick={() => setDeleteTarget(category)} aria-label={`Delete ${category.name}`}><Trash2 size={16} aria-hidden="true" /></button>
                                    </div>
                                ),
                            },
                        ]}
                        mobile={(category) => (
                            <div className="mobile-record">
                                <div className="mobile-record-header">
                                    <div className="primary-cell"><span className="category-swatch" style={{ backgroundColor: category.color || '#94a3b8' }} aria-hidden="true" /><span><strong>{category.name}</strong><small>{category.icon || 'No icon'}</small></span></div>
                                    <StatusBadge tone={category.type === 'income' ? 'positive' : 'info'}>{optionLabel(transactionTypeOptions, category.type)}</StatusBadge>
                                </div>
                                <div className="mobile-record-footer"><span>Status</span><StatusBadge tone={category.is_active ? 'positive' : 'neutral'}>{category.is_active ? 'Active' : 'Inactive'}</StatusBadge></div>
                                <div className="mobile-record-actions"><Button size="sm" variant="secondary" onClick={() => openEdit(category)} icon={<Pencil size={15} aria-hidden="true" />}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDeleteTarget(category)} icon={<Trash2 size={15} aria-hidden="true" />}>Delete</Button></div>
                            </div>
                        )}
                    />
                )}
            </section>

            <Modal open={formOpen} title={editing ? 'Edit category' : 'Add category'} description={editing ? 'Update the category details below.' : 'Create a category for income or expenses.'} onClose={() => setFormOpen(false)}>
                {formError ? <div className="form-alert" role="alert">{formError}</div> : null}
                <form className="form-stack" onSubmit={handleSubmit} noValidate>
                    <Field label="Category name" error={fieldErrors.name?.[0]} required>
                        {(props) => <input {...props} type="text" placeholder="e.g. Groceries" value={form.name} onChange={(event) => updateForm('name', event.target.value)} />}
                    </Field>
                    <Field label="Category type" error={fieldErrors.type?.[0]} required>
                        {(props) => <select {...props} value={form.type} onChange={(event) => updateForm('type', event.target.value as TransactionType)}>{transactionTypeOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>}
                    </Field>
                    <div className="form-grid-two">
                        <Field label="Icon key" error={fieldErrors.icon?.[0]} hint="Optional text key, such as food or home.">
                            {(props) => <input {...props} type="text" maxLength={50} value={form.icon} onChange={(event) => updateForm('icon', event.target.value)} />}
                        </Field>
                        <Field label="Color" error={fieldErrors.color?.[0]}>
                            {(props) => <input {...props} className="color-input" type="color" value={form.color} onChange={(event) => updateForm('color', event.target.value)} />}
                        </Field>
                    </div>
                    <CheckboxField label="Category is active" checked={form.is_active} onChange={(value) => updateForm('is_active', value)} />
                    <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create category'}</Button></div>
                </form>
            </Modal>

            <ConfirmDialog open={Boolean(deleteTarget)} title="Delete category?" description={`This will permanently remove ${deleteTarget?.name || 'this category'}. Existing transactions may be affected by the API.`} loading={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={() => void handleDelete()} />
        </div>
    )
}
