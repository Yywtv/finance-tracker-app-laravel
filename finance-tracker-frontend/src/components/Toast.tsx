import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react'

type ToastTone = 'success' | 'error'

interface ToastItem {
    id: number
    message: string
    tone: ToastTone
}

interface ToastContextValue {
    showToast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const dismiss = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
    }, [])

    const showToast = useCallback(
        (message: string, tone: ToastTone = 'success') => {
            const id = Date.now() + Math.random()
            setToasts((current) => [...current, { id, message, tone }])
            window.setTimeout(() => dismiss(id), 4500)
        },
        [dismiss],
    )

    const value = useMemo(() => ({ showToast }), [showToast])

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-region" aria-live="polite" aria-atomic="true">
                {toasts.map((toast) => (
                    <div className={`toast toast-${toast.tone}`} key={toast.id}>
                        {toast.tone === 'success' ? (
                            <CheckCircle2 size={18} aria-hidden="true" />
                        ) : (
                            <CircleAlert size={18} aria-hidden="true" />
                        )}
                        <span>{toast.message}</span>
                        <button
                            type="button"
                            className="toast-close"
                            onClick={() => dismiss(toast.id)}
                            aria-label="Dismiss notification"
                        >
                            <X size={16} aria-hidden="true" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within ToastProvider')
    return context
}
