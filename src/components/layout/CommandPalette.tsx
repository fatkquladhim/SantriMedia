// src/components/layout/CommandPalette.tsx
'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, ClipboardList, Building2, ArrowRight, Package } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { createPortal } from 'react-dom'

interface SearchResults {
    users: any[]
    tasks: any[]
    divisions: any[]
    equipment: any[]
}

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const router = useRouter()
    const { user } = useAuthStore()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResults | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    // Derived flat list — defined before effects so closures always see it
    const allResults = useMemo(() => [
        ...(results?.tasks.map(t => ({ ...t, type: 'task', label: t.judul, icon: ClipboardList, href: '/dashboard/tasks' })) ?? []),
        ...(results?.users.map(u => ({ ...u, type: 'user', label: u.full_name, icon: User, href: '/dashboard/admin/users' })) ?? []),
        ...(results?.divisions.map(d => ({ ...d, type: 'divisi', label: d.nama, icon: Building2, href: '/dashboard/admin/divisi' })) ?? []),
        ...(results?.equipment.map(e => ({
            ...e,
            type: 'alat_media',
            label: e.nama,
            icon: Package,
            href: user?.baseRole === 'admin' ? '/dashboard/admin/inventaris' : '/dashboard/inventaris',
        })) ?? []),
    ], [results, user?.baseRole])

    const handleSelect = useCallback((href: string) => {
        router.push(href)
        onClose()
    }, [router, onClose])

    // Reset state when closed, focus when opened
    useEffect(() => {
        if (!isOpen) {
            setQuery('')
            setResults(null)
            setActiveIndex(0)
        } else {
            const t = setTimeout(() => inputRef.current?.focus(), 100)
            return () => clearTimeout(t)
        }
    }, [isOpen])

    // Search Logic — encodeURIComponent prevents injection via query string
    useEffect(() => {
        if (query.length < 2) {
            setResults(null)
            return
        }
        const controller = new AbortController()
        const timer = setTimeout(async () => {
            setIsLoading(true)
            try {
                const res = await apiFetch(`/search/global?q=${encodeURIComponent(query)}`)
                setResults(res.data)
                setActiveIndex(0)
            } catch (err: any) {
                if (err?.name !== 'AbortError') setResults(null)
            } finally {
                setIsLoading(false)
            }
        }, 300)

        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [query])

    // Keyboard Navigation — bounds-clamped, Enter to navigate
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onClose(); return }
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex(prev => Math.min(prev + 1, allResults.length - 1))
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex(prev => Math.max(prev - 1, 0))
            }
            if (e.key === 'Enter' && allResults[activeIndex]) {
                handleSelect(allResults[activeIndex].href)
            }
        }
        if (isOpen) window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose, activeIndex, allResults, handleSelect])

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300">
                {/* Input Area */}
                <div className="p-6 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800">
                    <Search className="text-slate-400 shrink-0" size={24} />
                    <input
                        ref={inputRef}
                        type="text"
                        aria-label="Cari"
                        placeholder="Cari tugas, santri, atau alat media... (minimal 2 karakter)"
                        className="w-full bg-transparent border-none outline-none text-xl font-bold text-slate-800 dark:text-white placeholder:text-slate-400 placeholder:font-medium"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="hidden sm:flex shrink-0 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700 shadow-inner">
                        ESC
                    </div>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {query.length < 2 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Search size={32} />
                            </div>
                            <p className="text-slate-500 font-bold">Ketik minimal 2 huruf untuk memulai pencarian...</p>
                        </div>
                    ) : isLoading ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-4">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" role="status" aria-label="Memuat" />
                            <p className="text-slate-500 font-bold animate-pulse">Menghubungkan ke pusat data...</p>
                        </div>
                    ) : allResults.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-slate-500 font-bold italic">Tidak menemukan apapun untuk &ldquo;{query}&rdquo;</p>
                            <p className="text-xs text-slate-400 mt-2">Coba kata kunci yang lebih umum.</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1" role="listbox">
                            {allResults.map((item, idx) => (
                                <button
                                    key={`${item.type}-${item.id}`}
                                    role="option"
                                    aria-selected={idx === activeIndex}
                                    onClick={() => handleSelect(item.href)}
                                    className={`
                                        w-full flex items-center justify-between p-4 rounded-2xl transition-all group
                                        hover:bg-blue-50 dark:hover:bg-blue-500/10
                                        ${idx === activeIndex ? 'bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-500' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                                            <item.icon size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-slate-900 dark:text-slate-200 leading-none">{item.label}</p>
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">{item.type.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" size={18} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 font-sans">Enter</kbd> Select
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 font-sans">↑↓</kbd> Navigate
                        </div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400">
                        Santri Media ERP v2.0
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}