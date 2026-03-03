import React from 'react';

export interface TableColumn<T> {
    key: string;
    header: string;
    render: (row: T) => React.ReactNode;
    className?: string;
    headerClassName?: string;
}

interface TableProps<T> {
    columns: TableColumn<T>[];
    rows: T[];
    keyExtractor: (row: T) => string;
    emptyMessage?: string;
}

function Table<T>({
    columns,
    rows,
    keyExtractor,
    emptyMessage = 'No data found.',
}: TableProps<T>) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 dark:bg-background-dark/60 border-b border-slate-200 dark:border-surface-border">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                scope="col"
                                className={`px-6 py-4 text-xs font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider ${col.headerClassName ?? ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-surface-border">
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-6 py-10 text-center text-sm text-slate-500 dark:text-text-secondary"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr
                                key={keyExtractor(row)}
                                className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`px-6 py-4 whitespace-nowrap ${col.className ?? ''}`}
                                    >
                                        {col.render(row)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
