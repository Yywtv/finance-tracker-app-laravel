import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterPage } from './RegisterPage'

const { registerMock } = vi.hoisted(() => ({
    registerMock: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
    useAuth: () => ({ register: registerMock }),
}))

function renderRegisterPage() {
    return render(
        <MemoryRouter>
            <RegisterPage />
        </MemoryRouter>,
    )
}

describe('RegisterPage', () => {
    beforeEach(() => {
        registerMock.mockReset()
        registerMock.mockResolvedValue(undefined)
    })

    it('renders the registration form', () => {
        renderRegisterPage()

        expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
        expect(screen.getByLabelText(/Full name/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Email address/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Confirm password/)).toBeInTheDocument()
    })

    it('shows validation feedback before submitting an incomplete form', async () => {
        const user = userEvent.setup()
        renderRegisterPage()

        await user.type(screen.getByLabelText(/Password/), 'short')
        await user.click(screen.getByRole('button', { name: 'Create account' }))

        expect(await screen.findByText('Enter your name.')).toBeInTheDocument()
        expect(screen.getByText('Enter your email address.')).toBeInTheDocument()
        expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument()
        expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
        expect(registerMock).not.toHaveBeenCalled()
    })

    it('submits a valid registration', async () => {
        const user = userEvent.setup()
        renderRegisterPage()

        await user.type(screen.getByLabelText(/Full name/), 'Taylor Example')
        await user.type(screen.getByLabelText(/Email address/), 'taylor@example.com')
        await user.type(screen.getByLabelText(/Password/), 'password123')
        await user.type(screen.getByLabelText(/Confirm password/), 'password123')
        await user.click(screen.getByRole('button', { name: 'Create account' }))

        expect(registerMock).toHaveBeenCalledWith({
            name: 'Taylor Example',
            email: 'taylor@example.com',
            password: 'password123',
        })
    })
})
