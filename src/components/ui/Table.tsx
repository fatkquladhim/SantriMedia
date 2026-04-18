// src/components/ui/Table.tsx
import React from 'react'

interface TableProps {
    children: React.ReactNode
    className?: string
}

export function Table({ children, className = '' }: TableProps) {
    return (
        <div className="w-full overflow-x-auto">
            <table className={`w-full caption-bottom text-sm ${className}`}>
                {children}
            </table>
        </div>
    )
}

export function TableHeader({ children, className = '' }: TableProps) {
    return <thead className={`bg-slate-50/50 border-b border-slate-200 ${className}`}>{children}</thead>
}

export function TableBody({ children, className = '' }: TableProps) {
    return <tbody className={`divide-y divide-slate-100 ${className}`}>{children}</tbody>
}

export function TableRow({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr className={`transition-colors hover:bg-slate-50/50 ${className}`} {...props}>
            {children}
        </tr>
    )
}

export function TableHead({ children, className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th className={`h-12 px-4 text-left align-middle font-semibold text-slate-600 [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>
            {children}
        </th>
    )
}

export function TableCell({ children, className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>
            {children}
        </td>
    )
}