import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Account, Category, PaginatedResponse, Transaction } from '../types'
import { ToastProvider } from '../components/Toast'
import { TransactionsPage } from './TransactionsPage'

const { apiRequestMock, paths, reloadMock, useApiResourceMock } = vi.hoisted(() => ({
    apiRequestMock: vi.fn(),
    paths: [] as string[],
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

const accounts: Account[] = [
    {
        id: 1,
        user_id: 7,
        name: 'Everyday checking',
        type: 'checking',
        currency: 'USD',
        initial_balance: 100000,
        is_active: true,
    },
]

const categories: Category[] = [
    {
        id: 10,
        user_id: 7,
        name: 'Groceries',
        type: 'expense',
        icon: 'groceries',
        color: '#0f766e',
        is_active: true,
    },
    {
        id: 11,
        user_id: 7,
        name: 'Salary',
        type: 'income',
        icon: 'salary',
        color: '#147d61',
        is_active: true,
    },
]

const emptyTransactions: PaginatedResponse<Transaction> = {
    current_page: 1,
    data: [],
    from: null,
    last_page: 1,
    next_page_url: null,
    path: '/api/transactions',
    per_page: 20,
    prev_page_url: null,
    to: null,
    total: 0,
}

function resource<T>(data: T) {
    return {
        data,
        isLoading: false,
        error: null,
        reload: reloadMock,
        setData: vi.fn(),
    }
}

function renderTransactionsPage() {
    return render(
        <MemoryRouter initialEntries={['/transactions']}>
            <ToastProvider>
                <TransactionsPage />
            </ToastProvider>
        </MemoryRouter>,
    )
}

describe('TransactionsPage', () => {
    beforeEach(() => {
        paths.length = 0
        apiRequestMock.mockReset()
        apiRequestMock.mockResolvedValue({})
        reloadMock.mockReset()
        useApiResourceMock.mockReset()
        useApiResourceMock.mockImplementation((path: string) => {
            paths.push(path)

            if (path === '/accounts') return resource(accounts)
            if (path === '/categories') return resource(categories)
            return resource(emptyTransactions)
        })
    })

    it('opens the transaction form and submits a new transaction', async () => {
        const user = userEvent.setup()
        renderTransactionsPage()

        await user.click(screen.getAllByRole('button', { name: /Add transaction/ })[0])
        await user.selectOptions(screen.getByLabelText(/^Account/), '1')
        await user.selectOptions(screen.getByLabelText(/^Category/), '10')
        await user.type(screen.getByLabelText(/^Amount/), '75000')
        await user.type(screen.getByLabelText(/^Description/), 'Weekly groceries')
        await user.click(screen.getByRole('button', { name: 'Record transaction' }))

        await waitFor(() => {
            expect(apiRequestMock).toHaveBeenCalledWith(
                '/transactions',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.objectContaining({
                        account_id: 1,
                        category_id: 10,
                        type: 'expense',
                        amount: 75000,
                        description: 'Weekly groceries',
                    }),
                }),
            )
        })
    })

    it('applies transaction filters to the resource request', async () => {
        const user = userEvent.setup()
        renderTransactionsPage()

        await user.click(screen.getByRole('button', { name: /Filters/ }))
        await user.selectOptions(screen.getByLabelText(/^Type/), 'expense')
        await user.selectOptions(screen.getByLabelText(/^Account/), '1')
        await user.click(screen.getByRole('button', { name: 'Apply filters' }))

        await waitFor(() => {
            expect(paths.at(-1)).toBe('/transactions?type=expense&account_id=1')
        })
    })
})
