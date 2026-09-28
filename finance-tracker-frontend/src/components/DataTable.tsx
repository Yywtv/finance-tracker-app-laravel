import type { ReactNode } from 'react'

export interface TableColumn<T> {
    key: string
    header: ReactNode
    render: (row: T) => ReactNode
    align?: 'left' | 'right' | 'center'
}

export function DataTable<T>({
    columns,
    rows,
    rowKey,
    mobile,
}: {
    columns: Array<TableColumn<T>>
    rows: T[]
    rowKey: (row: T) => string | number
    mobile?: (row: T) => ReactNode
}) {
    return (
        <>
            <div className="table-wrap desktop-only">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={column.align ? `align-${column.align}` : ''}
                                    scope="col"
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={rowKey(row)}>
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={column.align ? `align-${column.align}` : ''}
                                    >
                                        {column.render(row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {mobile ? <div className="mobile-list">{rows.map((row) => <div key={rowKey(row)}>{mobile(row)}</div>)}</div> : null}
        </>
    )
}
