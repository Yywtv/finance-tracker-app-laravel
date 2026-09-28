import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, UserPlus } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getErrorMessage, getFieldErrors } from '../lib/api'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import type { ApiFieldErrors } from '../types'

export function RegisterPage() {
    const { register } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        passwordConfirmation: '',
    })
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const update = (field: keyof typeof form, value: string) => {
        setForm((current) => ({ ...current, [field]: value }))
        setFieldErrors((current) => ({ ...current, [field]: '' }))
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError('')
        setFieldErrors({})

        const nextErrors: ApiFieldErrors = {}
        if (!form.name.trim()) nextErrors.name = ['Enter your name.']
        if (!form.email.trim()) nextErrors.email = ['Enter your email address.']
        if (form.password.length < 8) {
            nextErrors.password = ['Use at least 8 characters.']
        }
        if (form.password !== form.passwordConfirmation) {
            nextErrors.passwordConfirmation = ['Passwords do not match.']
        }

        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors)
            return
        }

        setIsSubmitting(true)
        try {
            await register({
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
            })
            navigate('/', { replace: true })
        } catch (submitError) {
            setError(getErrorMessage(submitError, 'Unable to create your account.'))
            setFieldErrors(getFieldErrors(submitError))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="auth-card">
            <div className="auth-card-heading">
                <span className="auth-icon" aria-hidden="true">
                    <UserPlus size={21} />
                </span>
                <p className="eyebrow">Start organizing</p>
                <h1>Create your account</h1>
                <p>Set up a private workspace for your everyday finances.</p>
            </div>

            {error ? <div className="form-alert" role="alert">{error}</div> : null}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <Field label="Full name" error={fieldErrors.name?.[0]} required>
                    {(props) => (
                        <input
                            {...props}
                            type="text"
                            name="name"
                            autoComplete="name"
                            placeholder="Your name"
                            value={form.name}
                            onChange={(event) => update('name', event.target.value)}
                        />
                    )}
                </Field>
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
                <Field
                    label="Password"
                    error={fieldErrors.password?.[0]}
                    hint="At least 8 characters."
                    required
                >
                    {(props) => (
                        <input
                            {...props}
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            placeholder="Create a password"
                            value={form.password}
                            onChange={(event) => update('password', event.target.value)}
                        />
                    )}
                </Field>
                <Field
                    label="Confirm password"
                    error={fieldErrors.passwordConfirmation?.[0]}
                    required
                >
                    {(props) => (
                        <input
                            {...props}
                            type="password"
                            name="password_confirmation"
                            autoComplete="new-password"
                            placeholder="Repeat your password"
                            value={form.passwordConfirmation}
                            onChange={(event) => update('passwordConfirmation', event.target.value)}
                        />
                    )}
                </Field>
                <Button
                    type="submit"
                    loading={isSubmitting}
                    className="button-full"
                    icon={<ArrowRight size={17} aria-hidden="true" />}
                >
                    Create account
                </Button>
            </form>

            <p className="auth-switch">
                Already have an account? <Link to="/login">Sign in</Link>
            </p>
        </div>
    )
}
