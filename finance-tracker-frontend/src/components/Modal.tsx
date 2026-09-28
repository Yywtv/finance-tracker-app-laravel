import { useEffect, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
    open: boolean
    title: string
    description?: string
    onClose: () => void
    children: ReactNode
    size?: 'sm' | 'md' | 'lg'
}

export function Modal({
    open,
    title,
    description,
    onClose,
    children,
    size = 'md',
}: ModalProps) {
    const titleId = useId()
    const descriptionId = useId()

    useEffect(() => {
        if (!open) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }

        document.addEventListener('keydown', handleKeyDown)
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = previousOverflow
        }
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className="modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <section
                className={`modal modal-${size}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
            >
                <div className="modal-header">
                    <div>
                        <h2 id={titleId}>{title}</h2>
                        {description ? <p id={descriptionId}>{description}</p> : null}
                    </div>
                    <button
                        type="button"
                        className="icon-button"
                        onClick={onClose}
                        aria-label="Close dialog"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </section>
        </div>
    )
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Delete',
    loading = false,
    onCancel,
    onConfirm,
}: {
    open: boolean
    title: string
    description: string
    confirmLabel?: string
    loading?: boolean
    onCancel: () => void
    onConfirm: () => void
}) {
    return (
        <Modal open={open} title={title} description={description} onClose={onCancel} size="sm">
            <div className="modal-actions">
                <button type="button" className="button button-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button
                    type="button"
                    className="button button-danger"
                    onClick={onConfirm}
                    disabled={loading}
                >
                    {loading ? 'Deleting…' : confirmLabel}
                </button>
            </div>
        </Modal>
    )
}
