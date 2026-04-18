// src/components/ui/Badge.tsx
import React from 'react'

type BadgeVariant = 'default' | 'outline' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
    children: React.ReactNode
    variant?: BadgeVariant
    className?: string
}

const variants: Record<BadgeVariant, string> = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    outline: 'bg-transparent text-slate-600 border-slate-200',
    success: 'bg-blue-50 text-blue-700 border-blue-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    error: 'bg-rose-50 text-rose-700 border-rose-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
    return (
        <span className={`
      inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border
      ${variants[variant]}
      ${className}
    `}>
            {children}
        </span>
    )
}