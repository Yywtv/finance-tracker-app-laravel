import { LoaderCircle, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

export function LoadingState({ label = 'Loading' }: { label?: string }) {
    return (
        <div className="state-panel state-loading" role="status">
            <LoaderCircle className="spin" size={22} aria-hidden="true" />
            <span>{label}…</span>
        </div>
    )
}

export function ErrorState({
    title = 'Something went wrong',
    message,
    onRetry,
}: {
    title?: string
    message: string
    onRetry?: () => void
}) {
    return (
        <div className="state-panel state-error" role="alert">
            <div>
                <strong>{title}</strong>
                <p>{message}</p>
            </div>
            {onRetry ? (
                <button type="button" className="button button-secondary" onClick={onRetry}>
                    <RefreshCw size={16} aria-hidden="true" />
                    Try again
                </button>
            ) : null}
        </div>
    )
}

export function EmptyState({
    title,
    description,
    action,
}: {
    title: string
    description: string
    action?: ReactNode
}) {
    return (
        <div className="empty-state">
            <div className="empty-state-mark" aria-hidden="true">
                —
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
            {action}
        </div>
    )
}
