// src/components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useSidebarStore } from '@/stores/sidebarStore'
import { sidebarMenuConfig } from '@/config/sidebarMenu'
import { filterSidebarMenu } from '@/lib/filterSidebarMenu'
import { X, ChevronLeft, ChevronRight, LogOut, LayoutDashboard } from 'lucide-react'

export function Sidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuthStore()
    const { isOpen, isMobileOpen, toggle, closeMobile } = useSidebarStore()

    // Wait for user hydration
    if (!user) return (
        <div className="w-64 h-[calc(100vh-2rem)] m-4 rounded-3xl bg-white/50 dark:bg-slate-900/50 hidden lg:block border border-white/20 dark:border-slate-800/50 animate-pulse" />
    )

    const filteredMenu = filterSidebarMenu(sidebarMenuConfig, {
        baseRole: user.baseRole,
        dynamicPermissions: user.dynamicPermissions,
    })

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
                    onClick={closeMobile}
                />
            )}

            {/* Sidebar Core - Floating & Glassmorphic */}
            <aside
                className={cn(
                    'fixed xl:sticky top-0 left-0 z-50 lg:h-[calc(100dvh-2rem)] h-[100dvh] lg:m-4 lg:rounded-3xl glass-panel shadow-blue-900/5 transition-all duration-300 ease-in-out overflow-hidden flex flex-col',
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                    isOpen ? 'w-64' : 'w-20',
                    'bg-white/70 dark:bg-slate-900/70 border border-white/40 dark:border-slate-800/60'
                )}
            >
                {/* Header / Logo */}
                <div className="h-20 flex items-center px-4 shrink-0 transition-all duration-300">
                    <Link href="/dashboard" className="flex items-center gap-3 w-full">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 shrink-0 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
                            E
                        </div>
                        {isOpen && (
                            <span className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate tracking-tight transition-opacity duration-300">
                                ERP Pesantren
                            </span>
                        )}
                    </Link>

                    {/* Mobile Close */}
                    <button onClick={closeMobile} className="lg:hidden p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar">
                    <div className="flex flex-col px-3 gap-6">
                        {filteredMenu.map((group) => (
                            <div key={group.id} className="flex flex-col gap-1.5">
                                {isOpen && (
                                    <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                                        {group.label}
                                    </p>
                                )}

                                {group.items.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                                    const Icon = item.icon

                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            prefetch={true}
                                            onClick={() => window.innerWidth < 1024 && closeMobile()}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                                                isActive
                                                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-blue-700 dark:hover:text-blue-400',
                                                !isOpen && 'justify-center px-0'
                                            )}
                                            title={!isOpen ? item.label : undefined}
                                        >
                                            <Icon size={20} className={cn('shrink-0 transition-transform duration-200', isActive ? 'text-white' : 'group-hover:scale-110')} />
                                            {isOpen && <span className="font-medium truncate">{item.label}</span>}
                                        </Link>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer / User Profile & Logout */}
                <div className="p-4 mt-auto">
                    <button
                        onClick={() => logout()}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group",
                            !isOpen && 'justify-center px-0'
                        )}
                        title={!isOpen ? 'Logout' : undefined}
                    >
                        <LogOut size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
                        {isOpen && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Desktop Toggle Button */}
            <button
                onClick={toggle}
                className={cn(
                    "hidden lg:flex fixed top-8 z-50 items-center justify-center w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm rounded-full transition-all duration-300 ease-in-out hover:scale-110",
                    isOpen ? "left-[268px]" : "left-[76px]"
                )}
            >
                {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
        </>
    )
}