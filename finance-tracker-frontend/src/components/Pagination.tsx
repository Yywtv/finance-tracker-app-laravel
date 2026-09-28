import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({
    currentPage,
    lastPage,
    total,
    onPageChange,
}: {
    currentPage: number
    lastPage: number
    total: number
    onPageChange: (page: number) => void
}) {
    if (lastPage <= 1) return null

    return (
        <nav className="pagination" aria-label="Pagination">
            <p>
                Page {currentPage} of {lastPage} <span aria-hidden="true">·</span> {total} total
            </p>
            <div className="pagination-actions">
                <button
                    type="button"
                    className="button button-secondary button-sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <ChevronLeft size={16} aria-hidden="true" />
                    Previous
                </button>
                <button
                    type="button"
                    className="button button-secondary button-sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= lastPage}
                >
                    Next
                    <ChevronRight size={16} aria-hidden="true" />
                </button>
            </div>
        </nav>
    )
}
