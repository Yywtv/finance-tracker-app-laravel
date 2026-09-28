import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../types'
import { ToastProvider } from '../components/Toast'
import { AccountsPage } from './AccountsPage'

const { apiRequestMock, reloadMock, useApiResourceMock } = vi.hoisted(() => ({
    apiRequestMock: vi.fn(),
    reloadMock: vi.fn(),
    useApiResourceMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
    const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')

    return {
        ...actual,
        apiRequest: apiRequestMock,
    }
})

vi.mock('../hooks/useApiResource', () => ({
    useApiResource: useApiResourceMock,
}))

function resource<T>(data: T) {
    return {
        data,
        isLoading: false,
        error: null,
        reload: reloadMock,
        setData: vi.fn(),
    }
}

function renderAccountsPage() {
    return render(
        <MemoryRouter initialEntries={['/accounts']}>
            <ToastProvider>
                <AccountsPage />
            </ToastProvider>
        </MemoryRouter>,
    )
}

describe('AccountsPage', () => {
    beforeEach(() => {
        apiRequestMock.mockReset()
        apiRequestMock.mockResolvedValue({})
        reloadMock.mockReset()
        useApiResourceMock.mockReset()
        useApiResourceMock.mockReturnValue(resource<Account[]>([]))
    })

    it('submits a valid account form', async () => {
        const user = userEvent.setup()
        renderAccountsPage()

        await user.click(screen.getAllByRole('button', { name: /Add account/ })[0])
        await user.type(screen.getByLabelText(/Account name/), 'Rainy day savings')
        await user.clear(screen.getByLabelText(/Currency/))
        await user.type(screen.getByLabelText(/Currency/), 'usd')
        await user.type(screen.getByLabelText(/Opening balance/), '500000')
        await user.click(screen.getByRole('button', { name: 'Create account' }))

        await waitFor(() => {
            expect(apiRequestMock).toHaveBeenCalledWith(
                '/accounts',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.objectContaining({
                        name: 'Rainy day savings',
                        currency: 'USD',
                        initial_balance: 500000,
                    }),
                }),
            )
        })
    })
})
