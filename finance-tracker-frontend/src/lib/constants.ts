export const accountTypeOptions = [
    { value: 'checking', label: 'Checking' },
    { value: 'savings', label: 'Savings' },
    { value: 'cash', label: 'Cash' },
    { value: 'e_wallet', label: 'E-wallet' },
    { value: 'credit_card', label: 'Credit card' },
    { value: 'investment', label: 'Investment' },
    { value: 'other', label: 'Other' },
] as const

export const budgetPeriodOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
] as const

export const recurringFrequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
] as const

export const transactionTypeOptions = [
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
] as const

export const mimeTypeOptions = [
    { value: 'image/jpeg', label: 'JPEG image' },
    { value: 'image/png', label: 'PNG image' },
    { value: 'application/pdf', label: 'PDF document' },
] as const

export function optionLabel(
    options: ReadonlyArray<{ value: string; label: string }>,
    value: string,
): string {
    return options.find((option) => option.value === value)?.label ?? value
}
