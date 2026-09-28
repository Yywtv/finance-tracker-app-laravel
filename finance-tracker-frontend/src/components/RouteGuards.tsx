import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { LoadingState } from './Feedback'

export function ProtectedRoute() {
    const { user, isLoading } = useAuth()
    const location = useLocation()

    if (isLoading) {
        return (
            <div className="route-loading">
                <LoadingState label="Checking your session" />
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

    return <Outlet />
}

export function PublicOnlyRoute() {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="route-loading">
                <LoadingState label="Loading" />
            </div>
        )
    }

    return user ? <Navigate to="/" replace /> : <Outlet />
}
