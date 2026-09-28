import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'
import {
    clearToken,
    getCurrentUser,
    hasToken,
    loginUser,
    logoutUser,
    registerUser,
} from '../lib/api'
import type { User } from '../types'

interface AuthContextValue {
    user: User | null
    isLoading: boolean
    login: (input: {
        email: string
        password: string
        remember?: boolean
    }) => Promise<void>
    register: (input: {
        name: string
        email: string
        password: string
    }) => Promise<void>
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const refreshUser = useCallback(async () => {
        if (!hasToken()) {
            setUser(null)
            setIsLoading(false)
            return
        }

        try {
            const currentUser = await getCurrentUser()
            setUser(currentUser)
        } catch {
            clearToken()
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void refreshUser()

        const handleUnauthorized = () => {
            clearToken()
            setUser(null)
        }

        window.addEventListener('ledgerly:unauthorized', handleUnauthorized)
        return () => window.removeEventListener('ledgerly:unauthorized', handleUnauthorized)
    }, [refreshUser])

    const login = useCallback(
        async (input: { email: string; password: string; remember?: boolean }) => {
            const response = await loginUser(input)
            setUser(response.user)
        },
        [],
    )

    const register = useCallback(
        async (input: { name: string; email: string; password: string }) => {
            const response = await registerUser(input)
            setUser(response.user)
        },
        [],
    )

    const logout = useCallback(async () => {
        try {
            await logoutUser()
        } finally {
            setUser(null)
        }
    }, [])

    const value = useMemo(
        () => ({ user, isLoading, login, register, logout, refreshUser }),
        [user, isLoading, login, register, logout, refreshUser],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
