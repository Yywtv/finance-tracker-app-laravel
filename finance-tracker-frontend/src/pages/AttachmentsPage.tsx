import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FileText, Paperclip, Pencil, Plus, Trash2 } from 'lucide-react'
import { apiRequest, getErrorMessage, getFieldErrors } from '../lib/api'
import { mimeTypeOptions, optionLabel } from '../lib/constants'
import { formatDate, formatFileSize } from '../lib/format'
import { useApiResource } from '../hooks/useApiResource'
import { useToast } from '../components/Toast'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { ConfirmDialog, Modal } from '../components/Modal'
import { DataTable } from '../components/DataTable'
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback'
import { PageHeader } from '../components/PageHeader'
import type { ApiFieldErrors, PaginatedResponse, Transaction, TransactionAttachment } from '../types'

interface AttachmentFormState {
    transaction_id: string
    file_path: string
    original_filename: string
    mime_type: string
    file_size: string
}

function emptyForm(): AttachmentFormState {
    return {
        transaction_id: '',
        file_path: '',
        original_filename: '',
        mime_type: 'application/pdf',
        file_size: '',
    }
}

function toForm(attachment: TransactionAttachment): AttachmentFormState {
    return {
        transaction_id: String(attachment.transaction_id),
        file_path: attachment.file_path,
        original_filename: attachment.original_filename,
        mime_type: attachment.mime_type,
        file_size: String(attachment.file_size),
    }
}

export function AttachmentsPage() {
    const { showToast } = useToast()
    const attachments = useApiResource<TransactionAttachment[]>('/transaction-attachments')
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loadingTransactions, setLoadingTransactions] = useState(true)
    const [transactionError, setTransactionError] = useState(false)
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<TransactionAttachment | null>(null)
    const [form, setForm] = useState<AttachmentFormState>(emptyForm)
    const [formError, setFormError] = useState('')
    const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<TransactionAttachment | null>(null)
    const [deleting, setDeleting] = useState(false)

    const loadTransactions = async () => {
        setLoadingTransactions(true)
        setTransactionError(false)
        try {
            const all: Transaction[] = []
            let page = 1
            let lastPage = 1
            do {
                const response = await apiRequest<PaginatedResponse<Transaction>>(`/transactions?page=${page}`)
                all.push(...response.data)
                lastPage = response.last_page
                page += 1
            } while (page <= lastPage && page <= 100)
            setTransactions(all)
        } catch {
            setTransactionError(true)
        } finally {
            setLoadingTransactions(false)
        }
    }

    useEffect(() => {
        void loadTransactions()
    }, [])

    const transactionMap = useMemo(
        () => new Map(transactions.map((transaction) => [transaction.id, transaction])),
        [transactions],
    )

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm())
        setFieldErrors({})
        setFormError('')
        setFormOpen(true)
    }

    const openEdit = (attachment: TransactionAttachment) => {
        setEditing(attachment)
        setForm(toForm(attachment))
        setFieldErrors({})
        setFormError('')
        setFormOpen(true)
    }

    const updateForm = <K extends keyof AttachmentFormState>(key: K, value: AttachmentFormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }))
        setFieldErrors((current) => ({ ...current, [key]: '' }))
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFormError('')
        setFieldErrors({})
        const size = Number(form.file_size)
        const nextErrors: ApiFieldErrors = {}
        if (!editing && !form.transaction_id) nextErrors.transaction_id = ['Choose a transaction.']
        if (!form.file_path.trim()) nextErrors.file_path = ['Enter the stored file path.']
        if (!form.original_filename.trim()) nextErrors.original_filename = ['Enter the original file name.']
        if (!Number.isSafeInteger(size) || size < 1) nextErrors.file_size = ['Enter a whole number greater than zero.']
        if (size > 5_242_880) nextErrors.file_size = ['File size must be 5 MB or less.']
        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors)
            return
        }

        setSaving(true)
        try {
            const payload = {
                ...(editing ? {} : { transaction_id: Number(form.transaction_id) }),
                file_path: form.file_path.trim(),
                original_filename: form.original_filename.trim(),
                mime_type: form.mime_type,
                file_size: size,
            }
            await apiRequest<TransactionAttachment>(editing ? `/transaction-attachments/${editing.id}` : '/transaction-attachments', {
                method: editing ? 'PUT' : 'POST',
                body: payload,
            })
            setFormOpen(false)
            showToast(editing ? 'Attachment metadata updated.' : 'Attachment metadata created.')
            await attachments.reload()
        } catch (error) {
            setFormError(getErrorMessage(error, 'Unable to save the attachment.'))
            setFieldErrors(getFieldErrors(error))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await apiRequest(`/transaction-attachments/${deleteTarget.id}`, { method: 'DELETE' })
            setDeleteTarget(null)
            showToast('Attachment deleted.')
            await attachments.reload()
        } catch (error) {
            showToast(getErrorMessage(error, 'Unable to delete the attachment.'), 'error')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="page-stack">
            <PageHeader eyebrow="Records" title="Transaction attachments" description="Keep receipt and document metadata connected to the transactions it supports." action={<Button onClick={openCreate} icon={<Plus size={17} aria-hidden="true" />}>Add attachment</Button>} />
            <div className="info-banner"><Paperclip size={18} aria-hidden="true" /><span>The current API accepts attachment metadata and a stored file path. It does not upload or serve files, so add metadata for files that are already available to your storage.</span></div>

            <section className="surface">
                {attachments.isLoading ? <LoadingState label="Loading attachments" /> : attachments.error ? <ErrorState message="We could not load attachments." onRetry={() => void attachments.reload()} /> : (attachments.data || []).length === 0 ? <EmptyState title="No attachments yet" description="Add metadata for a receipt or document linked to a transaction." action={<Button size="sm" onClick={openCreate}>Add attachment</Button>} /> : (
                    <DataTable
                        rows={attachments.data || []}
                        rowKey={(attachment) => attachment.id}
                        columns={[
                            { key: 'file', header: 'File', render: (attachment) => <div className="primary-cell"><span className="row-icon"><FileText size={17} aria-hidden="true" /></span><span><strong>{attachment.original_filename}</strong><small>{attachment.file_path}</small></span></div> },
                            { key: 'transaction', header: 'Transaction', render: (attachment) => { const transaction = transactionMap.get(attachment.transaction_id); return transaction ? <span><strong>{transaction.description}</strong><small className="table-subtext">{formatDate(transaction.transaction_date)}</small></span> : `Transaction #${attachment.transaction_id}`; } },
                            { key: 'type', header: 'Type', render: (attachment) => optionLabel(mimeTypeOptions, attachment.mime_type) },
                            { key: 'size', header: 'Size', align: 'right', render: (attachment) => formatFileSize(attachment.file_size) },
                            { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (attachment) => <div className="row-actions"><button type="button" className="icon-button" onClick={() => openEdit(attachment)} aria-label={`Edit ${attachment.original_filename}`}><Pencil size={16} aria-hidden="true" /></button><button type="button" className="icon-button danger-icon" onClick={() => setDeleteTarget(attachment)} aria-label={`Delete ${attachment.original_filename}`}><Trash2 size={16} aria-hidden="true" /></button></div> },
                        ]}
                        mobile={(attachment) => { const transaction = transactionMap.get(attachment.transaction_id); return <div className="mobile-record"><div className="mobile-record-header"><div className="primary-cell"><span className="row-icon"><FileText size={17} aria-hidden="true" /></span><span><strong>{attachment.original_filename}</strong><small>{attachment.file_path}</small></span></div><strong>{formatFileSize(attachment.file_size)}</strong></div><div className="mobile-record-footer"><span>{transaction?.description || `Transaction #${attachment.transaction_id}`}</span><span>{optionLabel(mimeTypeOptions, attachment.mime_type)}</span></div><div className="mobile-record-actions"><Button size="sm" variant="secondary" onClick={() => openEdit(attachment)} icon={<Pencil size={15} aria-hidden="true" />}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDeleteTarget(attachment)} icon={<Trash2 size={15} aria-hidden="true" />}>Delete</Button></div></div> }}
                    />
                )}
            </section>

            <Modal open={formOpen} title={editing ? 'Edit attachment metadata' : 'Add attachment metadata'} description={editing ? 'Update the stored file details below.' : 'Connect stored file metadata to a transaction.'} onClose={() => setFormOpen(false)} size="lg">
                {formError ? <div className="form-alert" role="alert">{formError}</div> : null}
                <form className="form-stack" onSubmit={handleSubmit} noValidate>
                    {!editing ? <Field label="Transaction" error={fieldErrors.transaction_id?.[0]} required>{(props) => <select {...props} value={form.transaction_id} disabled={loadingTransactions || transactionError} onChange={(event) => updateForm('transaction_id', event.target.value)}><option value="">{loadingTransactions ? 'Loading transactions…' : transactionError ? 'Transactions unavailable' : 'Select a transaction'}</option>{transactions.map((transaction) => <option key={transaction.id} value={transaction.id}>{transaction.description} · {formatDate(transaction.transaction_date)}</option>)}</select>}</Field> : <div className="readonly-field"><span>Transaction</span><strong>{transactionMap.get(editing.transaction_id)?.description || `Transaction #${editing.transaction_id}`}</strong></div>}
                    <div className="form-grid-two"><Field label="Stored file path" error={fieldErrors.file_path?.[0]} hint="The path expected by your storage layer." required>{(props) => <input {...props} type="text" maxLength={255} placeholder="transactions/receipt.pdf" value={form.file_path} onChange={(event) => updateForm('file_path', event.target.value)} />}</Field><Field label="Original file name" error={fieldErrors.original_filename?.[0]} required>{(props) => <input {...props} type="text" maxLength={255} placeholder="receipt.pdf" value={form.original_filename} onChange={(event) => updateForm('original_filename', event.target.value)} />}</Field></div>
                    <div className="form-grid-two"><Field label="File type" error={fieldErrors.mime_type?.[0]} required>{(props) => <select {...props} value={form.mime_type} onChange={(event) => updateForm('mime_type', event.target.value)}>{mimeTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}</Field><Field label="File size in bytes" error={fieldErrors.file_size?.[0]} hint="Maximum 5,242,880 bytes." required>{(props) => <input {...props} type="number" min="1" max="5242880" step="1" inputMode="numeric" placeholder="102400" value={form.file_size} onChange={(event) => updateForm('file_size', event.target.value)} />}</Field></div>
                    <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create metadata'}</Button></div>
                </form>
            </Modal>
            <ConfirmDialog open={Boolean(deleteTarget)} title="Delete attachment metadata?" description={`This will remove the metadata for ${deleteTarget?.original_filename || 'this attachment'}.`} loading={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={() => void handleDelete()} />
        </div>
    )
}
