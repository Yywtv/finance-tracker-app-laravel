const numberFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
})

export function formatNumber(value: number | string | null | undefined): string {
    const numeric = typeof value === 'string' ? Number(value) : value

    if (numeric === null || numeric === undefined || !Number.isFinite(numeric)) {
        return '—'
    }

    return numberFormatter.format(numeric)
}

export function formatMoney(
    value: number | string | null | undefined,
    currency?: string | null,
): string {
    const numeric = typeof value === 'string' ? Number(value) : value

    if (numeric === null || numeric === undefined || !Number.isFinite(numeric)) {
        return '—'
    }

    if (!currency) {
        return formatNumber(numeric)
    }

    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
        }).format(numeric)
    } catch {
        return `${formatNumber(numeric)} ${currency}`
    }
}

export function formatDate(value: string | null | undefined): string {
    if (!value) return '—'

    const date = new Date(`${value.slice(0, 10)}T00:00:00`)
    return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) return '—'

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function titleCase(value: string): string {
    return value
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
}

export function todayInputValue(): string {
    const now = new Date()
    const offset = now.getTimezoneOffset()
    return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10)
}
