import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
    return (
        <div className="not-found">
            <span className="eyebrow">404</span>
            <h1>That page is not here.</h1>
            <p>Check the address or return to your finance overview.</p>
            <Link className="button button-primary button-md" to="/">
                <ArrowLeft size={17} aria-hidden="true" />
                Back to overview
            </Link>
        </div>
    )
}
