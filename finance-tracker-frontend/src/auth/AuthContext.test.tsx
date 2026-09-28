import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { ProtectedRoute } from '../components/RouteGuards'

const {
    clearTokenMock,
    getCurrentUserMock,
    hasTokenMock,
    loginUserMock,
    logoutUserMock,
    registerUserMock,
} = vi.hoisted(() => ({
    clearTokenMock: vi.fn(),
    getCurrentUserMock: vi.fn(),
    hasTokenMock: vi.fn(),
    loginUserMock: vi.fn(),
    logoutUserMock: vi.fn(),
    registerUserMock: vi.fn(),
}))

vi.mock('../lib/api', () => ({
    clearToken: clearTokenMock,
    getCurrentUser: getCurrentUserMock,
    hasToken: hasTokenMock,
    loginUser: loginUserMock,
    logoutUser: logoutUserMock,
    registerUser: registerUserMock,
}))

function renderAuthRoutes() {
    return render(
        <AuthProvider>
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<div>Protected content</div>} />
                    </Route>
                    <Route path="/login" element={<div>Login screen</div>} />
                </Routes>
            </MemoryRouter>
        </AuthProvider>,
    )
}

describe('AuthProvider and ProtectedRoute', () => {
    beforeEach(() => {
        clearTokenMock.mockReset()
        getCurrentUserMock.mockReset()
        hasTokenMock.mockReset()
        hasTokenMock.mockReturnValue(false)
    })

    it('loads the current user before rendering protected content', async () => {
        hasTokenMock.mockReturnValue(true)
        getCurrentUserMock.mockResolvedValue({
            id: 1,
            name: 'Taylor Example',
            email: 'taylor@example.com',
            email_verified_at: null,
        })

        renderAuthRoutes()

        expect(await screen.findByText('Protected content')).toBeInTheDocument()
        expect(getCurrentUserMock).toHaveBeenCalledTimes(1)
    })

    it('redirects to login when no stored token exists', async () => {
        renderAuthRoutes()

        expect(await screen.findByText('Login screen')).toBeInTheDocument()
        expect(getCurrentUserMock).not.toHaveBeenCalled()
    })
})
