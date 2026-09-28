import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'

const { loginMock } = vi.hoisted(() => ({
    loginMock: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
    useAuth: () => ({ login: loginMock }),
}))

function renderLoginPage() {
    return render(
        <MemoryRouter>
            <LoginPage />
        </MemoryRouter>,
    )
}

describe('LoginPage', () => {
    beforeEach(() => {
        loginMock.mockReset()
        loginMock.mockResolvedValue(undefined)
    })

    it('renders the sign-in form', () => {
        renderLoginPage()

        expect(screen.getByRole('heading', { name: 'Sign in to Ledgerly' })).toBeInTheDocument()
        expect(screen.getByLabelText(/Email address/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    })

    it('submits the entered credentials', async () => {
        const user = userEvent.setup()
        renderLoginPage()

        await user.type(screen.getByLabelText(/Email address/), 'person@example.com')
        await user.type(screen.getByLabelText(/Password/), 'password123')
        await user.click(screen.getByRole('button', { name: 'Sign in' }))

        expect(loginMock).toHaveBeenCalledWith({
            email: 'person@example.com',
            password: 'password123',
        })
    })
})
