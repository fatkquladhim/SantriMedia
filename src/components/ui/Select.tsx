// src/components/ui/Select.tsx
import React from 'react'

interface Option {
    value: string
    label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    options: Option[]
    error?: string
    placeholder?: string
}

export function Select({ label, options, error, placeholder, className = '', ...props }: SelectProps) {
    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <label className="text-sm font-medium text-slate-700">
                    {label}
                    {props.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
            )}
            <select
                className={`
          flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm 
          ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium 
          placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 
          focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed 
          disabled:opacity-50 transition-all duration-200
          ${error ? 'border-rose-500 focus-visible:ring-rose-500' : 'hover:border-slate-300'}
          ${className}
        `}
                {...props}
            >
                <option value="" disabled>{placeholder || `Pilih ${label || 'opsi'}...`}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>
    )
}