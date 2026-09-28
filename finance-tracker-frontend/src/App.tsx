import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AppShell, AuthLayout } from './components/AppShell'
import { PublicOnlyRoute, ProtectedRoute } from './components/RouteGuards'
import { ToastProvider } from './components/Toast'
import { AccountsPage } from './pages/AccountsPage'
import { AttachmentsPage } from './pages/AttachmentsPage'
import { BudgetsPage } from './pages/BudgetsPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RecurringTransfersPage } from './pages/RecurringTransfersPage'
import { RegisterPage } from './pages/RegisterPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { TransfersPage } from './pages/TransfersPage'

function AuthLayoutRoute() {
    return (
        <AuthLayout>
            <Outlet />
        </AuthLayout>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <Routes>
                        <Route element={<PublicOnlyRoute />}>
                            <Route element={<AuthLayoutRoute />}>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />
                            </Route>
                        </Route>

                        <Route element={<ProtectedRoute />}>
                            <Route element={<AppShell />}>
                                <Route index element={<DashboardPage />} />
                                <Route path="dashboard" element={<DashboardPage />} />
                                <Route path="accounts" element={<AccountsPage />} />
                                <Route path="accounts/new" element={<AccountsPage />} />
                                <Route path="transactions" element={<TransactionsPage />} />
                                <Route path="transactions/new" element={<TransactionsPage />} />
                                <Route path="transfers" element={<TransfersPage />} />
                                <Route path="categories" element={<CategoriesPage />} />
                                <Route path="budgets" element={<BudgetsPage />} />
                                <Route path="recurring-transfers" element={<RecurringTransfersPage />} />
                                <Route path="attachments" element={<AttachmentsPage />} />
                            </Route>
                        </Route>

                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
