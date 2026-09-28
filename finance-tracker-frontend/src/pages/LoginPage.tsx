import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getErrorMessage, getFieldErrors } from '../lib/api'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import type { ApiFieldErrors } from '../types'

export function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const update = (field: keyof typeof form, value: string | boolean) => {
        setForm((current) => ({ ...current, [field]: value }))
        setFieldErrors((current) => ({ ...current, [field]: '' }))
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError('')
        setFieldErrors({})

        if (!form.email.trim() || !form.password) {
            setFieldErrors({
                ...(form.email.trim() ? {} : { email: ['Enter your email address.'] }),
                ...(form.password ? {} : { password: ['Enter your password.'] }),
            })
            return
        }

        setIsSubmitting(true)
        try {
            await login({
                email: form.email.trim(),
                password: form.password,
            })
            const destination =
                typeof location.state === 'object' && location.state !== null
                    ? (location.state as { from?: string }).from
                    : undefined
            navigate(destination || '/', { replace: true })
        } catch (submitError) {
            setError(getErrorMessage(submitError, 'Unable to sign in.'))
            setFieldErrors(getFieldErrors(submitError))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="auth-card">
            <div className="auth-card-heading">
                <span className="auth-icon" aria-hidden="true">
                    <ShieldCheck size={21} />
                </span>
                <p className="eyebrow">Welcome back</p>
                <h1>Sign in to Ledgerly</h1>
                <p>Use your account email and password to continue.</p>
            </div>

            {error ? <div className="form-alert" role="alert">{error}</div> : null}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <Field label="Email address" error={fieldErrors.email?.[0]} required>
                    {(props) => (
                        <input
                            {...props}
                            type="email"
                            name="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={(event) => update('email', event.target.value)}
                        />
                    )}
                </Field>
                <Field label="Password" error={fieldErrors.password?.[0]} required>
                    {(props) => (
                        <input
                            {...props}
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            placeholder="Your password"
                            value={form.password}
                            onChange={(event) => update('password', event.target.value)}
                        />
                    )}
                </Field>
                <Button
                    type="submit"
                    loading={isSubmitting}
                    className="button-full"
                    icon={<ArrowRight size={17} aria-hidden="true" />}
                >
                    Sign in
                </Button>
            </form>

            <p className="auth-switch">
                New to Ledgerly? <Link to="/register">Create an account</Link>
            </p>
        </div>
    )
}
