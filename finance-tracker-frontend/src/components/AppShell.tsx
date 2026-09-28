import {
    BarChart3,
    CalendarClock,
    ChevronDown,
    CircleDollarSign,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    Repeat2,
    Tags,
    WalletCards,
    X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { initials } from '../lib/format'

const navigation = [
    { label: 'Overview', to: '/', icon: LayoutDashboard, end: true },
    { label: 'Accounts', to: '/accounts', icon: WalletCards },
    { label: 'Transactions', to: '/transactions', icon: CircleDollarSign },
    { label: 'Transfers', to: '/transfers', icon: Repeat2 },
    { label: 'Categories', to: '/categories', icon: Tags },
    { label: 'Budgets', to: '/budgets', icon: BarChart3 },
    { label: 'Recurring', to: '/recurring-transfers', icon: CalendarClock },
    { label: 'Attachments', to: '/attachments', icon: FileText },
]

function Brand() {
    return (
        <div className="brand">
            <span className="brand-mark" aria-hidden="true">
                L
            </span>
            <span>
                <strong>Ledgerly</strong>
                <small>Personal finance</small>
            </span>
        </div>
    )
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
    return (
        <nav className="main-nav" aria-label="Main navigation">
            <p className="nav-section-label">Workspace</p>
            {navigation.map(({ label, to, icon: Icon, end }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    )
}

function UserPanel({ compact = false }: { compact?: boolean }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)

    if (!user) return null

    const handleLogout = async () => {
        try {
            await logout()
        } finally {
            navigate('/login', { replace: true })
        }
    }

    return (
        <div className={`user-panel ${compact ? 'user-panel-compact' : ''}`}>
            <button
                type="button"
                className="user-trigger"
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <span className="avatar">{initials(user.name)}</span>
                <span className="user-trigger-copy">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                </span>
                <ChevronDown size={16} aria-hidden="true" />
            </button>
            {open ? (
                <div className="user-menu" role="menu">
                    <div className="user-menu-heading">
                        <span>Signed in as</span>
                        <strong>{user.email}</strong>
                    </div>
                    <button type="button" role="menuitem" onClick={handleLogout}>
                        <LogOut size={16} aria-hidden="true" />
                        Sign out
                    </button>
                </div>
            ) : null}
        </div>
    )
}

export function AppShell() {
    const [mobileOpen, setMobileOpen] = useState(false)
    const location = useLocation()

    return (
        <div className="app-frame">
            <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-topline">
                    <Brand />
                    <button
                        type="button"
                        className="icon-button mobile-only"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close navigation"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>
                <Navigation onNavigate={() => setMobileOpen(false)} />
                <div className="sidebar-bottom">
                    <div className="sidebar-note">
                        <span className="sidebar-note-dot" aria-hidden="true" />
                        <div>
                            <strong>Private workspace</strong>
                            <small>Your data stays in your account.</small>
                        </div>
                    </div>
                    <UserPanel />
                </div>
            </aside>

            {mobileOpen ? (
                <button
                    type="button"
                    className="sidebar-overlay"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation overlay"
                />
            ) : null}

            <div className="main-column">
                <header className="mobile-header mobile-only">
                    <button
                        type="button"
                        className="icon-button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open navigation"
                    >
                        <Menu size={21} aria-hidden="true" />
                    </button>
                    <Brand />
                    <UserPanel compact />
                </header>
                <main className="content-area" key={location.pathname}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="auth-frame">
            <div className="auth-aside">
                <Brand />
                <div className="auth-aside-copy">
                    <p className="eyebrow">A calmer way to manage money</p>
                    <h1>Know where your money is going.</h1>
                    <p>
                        Keep accounts, transactions, transfers, and budgets in one focused
                        workspace.
                    </p>
                </div>
                <div className="auth-aside-footer">
                    <span>Ledgerly</span>
                    <span>Personal finance, clearly organized.</span>
                </div>
            </div>
            <div className="auth-content">{children}</div>
        </div>
    )
}
