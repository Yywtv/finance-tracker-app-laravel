import type {
    ApiErrorPayload,
    ApiFieldErrors,
    AuthResponse,
    User,
} from '../types'

const configuredApiUrl = (
    import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
).replace(/\/+$/, '')

export const API_URL = configuredApiUrl

const tokenStorageKey = 'ledgerly.api-token'
let memoryToken: string | null = null

export class ApiError extends Error {
    readonly status: number
    readonly errors: ApiFieldErrors
    readonly payload: ApiErrorPayload | null

    constructor(
        status: number,
        message: string,
        errors: ApiFieldErrors = {},
        payload: ApiErrorPayload | null = null,
    ) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.errors = errors
        this.payload = payload
    }
}

function getToken(): string | null {
    if (memoryToken) return memoryToken

    try {
        memoryToken = window.localStorage.getItem(tokenStorageKey)
    } catch {
        memoryToken = null
    }

    return memoryToken
}

export function setToken(token: string): void {
    memoryToken = token

    try {
        window.localStorage.setItem(tokenStorageKey, token)
    } catch {
        // Keep the in-memory token for the current tab when storage is unavailable.
    }
}

export function clearToken(): void {
    memoryToken = null

    try {
        window.localStorage.removeItem(tokenStorageKey)
    } catch {
        // Storage can be unavailable in privacy-restricted browsers.
    }
}

export function hasToken(): boolean {
    return Boolean(getToken())
}

function normalizeErrors(payload: ApiErrorPayload | null): ApiFieldErrors {
    if (!payload?.errors || typeof payload.errors !== 'object') return {}

    return Object.fromEntries(
        Object.entries(payload.errors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages : [String(messages)],
        ]),
    )
}

function messageForStatus(status: number, payload: ApiErrorPayload | null): string {
    if (status === 401) return 'Your session has expired. Please sign in again.'
    if (status === 403) return 'You do not have permission to perform that action.'
    if (status === 422) return 'Please check the highlighted fields and try again.'
    if (status === 429) return 'Too many requests. Please wait a moment and try again.'
    if (status >= 500) return 'The finance server is having trouble right now. Please try again.'

    return payload?.message || 'The request could not be completed.'
}

async function parseResponse(response: Response): Promise<unknown> {
    if (response.status === 204) return undefined

    const text = await response.text()
    if (!text) return undefined

    try {
        return JSON.parse(text) as unknown
    } catch {
        return text
    }
}

async function execute<T>(url: string, init: RequestInit): Promise<T> {
    let response: Response

    try {
        response = await fetch(url, init)
    } catch {
        throw new ApiError(
            0,
            'Unable to reach the finance server. Check that the API is running and try again.',
        )
    }

    const body = await parseResponse(response)
    const payload =
        body && typeof body === 'object' ? (body as ApiErrorPayload) : null

    if (!response.ok) {
        if (response.status === 401) {
            window.dispatchEvent(new Event('ledgerly:unauthorized'))
        }

        throw new ApiError(
            response.status,
            messageForStatus(response.status, payload),
            normalizeErrors(payload),
            payload,
        )
    }

    return body as T
}

type RequestOptions = Omit<RequestInit, 'body'> & {
    body?: unknown
}

export async function apiRequest<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const token = getToken()
    const headers = new Headers(options.headers)
    headers.set('Accept', 'application/json')

    if (options.body !== undefined && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json')
    }

    if (token) headers.set('Authorization', `Bearer ${token}`)

    const body =
        options.body === undefined || options.body instanceof FormData
            ? undefined
            : JSON.stringify(options.body)

    return execute<T>(`${API_URL}${path}`, {
        ...options,
        headers,
        body,
    })
}

export async function getCurrentUser(): Promise<User> {
    return apiRequest<User>('/user')
}

export async function registerUser(input: {
    name: string
    email: string
    password: string
}): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/register', {
        method: 'POST',
        body: input,
    })

    if (response.token) setToken(response.token)
    return response
}

export async function loginUser(input: {
    email: string
    password: string
    remember?: boolean
}): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/login', {
        method: 'POST',
        body: input,
    })

    if (response.token) setToken(response.token)
    return response
}

export async function logoutUser(): Promise<void> {
    try {
        if (hasToken()) await apiRequest<void>('/logout', { method: 'POST' })
    } finally {
        clearToken()
    }
}

export function queryString(values: Record<string, string | number | undefined | null>): string {
    const params = new URLSearchParams()

    Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value))
        }
    })

    const result = params.toString()
    return result ? `?${result}` : ''
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
    if (error instanceof ApiError) return error.message
    if (error instanceof Error && error.message) return error.message
    return fallback
}

export function getFieldErrors(error: unknown): ApiFieldErrors {
    return error instanceof ApiError ? error.errors : {}
}
