import { useId, type ReactNode } from 'react'

interface FieldProps {
    label: string
    children: (props: {
        id: string
        'aria-describedby'?: string
        'aria-required'?: boolean
    }) => ReactNode
    error?: string
    hint?: string
    required?: boolean
    className?: string
}

export function Field({
    label,
    children,
    error,
    hint,
    required = false,
    className = '',
}: FieldProps) {
    const id = useId()
    const descriptionId = error || hint ? `${id}-description` : undefined

    return (
        <div className={`field ${className}`.trim()}>
            <label htmlFor={id}>
                {label}
                {required ? <span className="required-mark">*</span> : null}
            </label>
            {children({
                id,
                'aria-describedby': descriptionId,
                'aria-required': required || undefined,
            })}
            {error ? (
                <p className="field-message field-error" id={descriptionId} role="alert">
                    {error}
                </p>
            ) : hint ? (
                <p className="field-message" id={descriptionId}>
                    {hint}
                </p>
            ) : null}
        </div>
    )
}

interface CheckboxFieldProps {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
    hint?: string
}

export function CheckboxField({ label, checked, onChange, hint }: CheckboxFieldProps) {
    const id = useId()
    const descriptionId = hint ? `${id}-description` : undefined

    return (
        <div className="checkbox-field">
            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                aria-describedby={descriptionId}
            />
            <div>
                <label htmlFor={id}>{label}</label>
                {hint ? (
                    <p className="field-message" id={descriptionId}>
                        {hint}
                    </p>
                ) : null}
            </div>
        </div>
    )
}
