// src/components/layout/Header.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
    Menu, Bell, CheckCircle2, ChevronDown, 
    User as UserIcon, Settings, LogOut 
} from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useAuthStore } from '@/stores/authStore'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import { CommandPalette } from './CommandPalette'
import { createClient } from '@/lib/supabase/client'

export function Header() {
    const { toggleMobile } = useSidebarStore()
    const { user, logout } = useAuthStore()
    const [isNotifOpen, setIsNotifOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const notifRef = useRef<HTMLDivElement>(null)
    const profileRef = useRef<HTMLDivElement>(null)

    const { data: notifData, fetchData: fetchNotifs } = useApi('/notifications?is_read=false', { immediate: !!user })
    const [isPinging, setIsPinging] = useState(false)
    
    const notifications = notifData?.data || []
    const unreadCount = notifications.length

    // Real-time Notifications Subscription
    useEffect(() => {
        if (!user) return;

        const supabase = createClient();

        const channel = supabase
            .channel(`notif-${user.id}`) // Unique channel per user
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('New notification received!', payload);
                    fetchNotifs(); 
                    
                    // Trigger "ping" animation
                    setIsPinging(true)
                    setTimeout(() => setIsPinging(false), 2000)
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchNotifs]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        try {
            await apiFetch('/notifications/read-all', { method: 'PATCH' })
            fetchNotifs()
        } catch (err) {
            console.error(err)
        }
    }

    const handleMarkRead = async (id: string, link?: string) => {
        try {
            // Optimistic update: remove from local state immediately
            // Since we use useApi hook, we'd ideally filter locally OR just fetch. 
            // For now, let's just do the fetch but ensure linking works.
            await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' })
            fetchNotifs()
            if (link) window.location.href = link
        } catch (err) {
            console.error(err)
        }
    }

    // Keyboard Shortcut for Search (Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setIsSearchOpen(true)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <header className={cn(
            "sticky top-0 z-40 h-20 flex items-center justify-between px-6 lg:px-8 shrink-0 transition-all duration-300",
            "bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-white/20 dark:border-slate-800/50"
        )}>
            {/* Mobile Left */}
            <div className="flex items-center gap-4 lg:hidden">
                <button
                    onClick={toggleMobile}
                    className="p-2 -ml-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800/50 rounded-xl transition-all"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Desktop Left (Welcome text) */}
            <div className="hidden lg:flex items-center">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="font-normal text-slate-500">Selamat datang kembali,</span>
                    <span className="text-blue-700 dark:text-blue-400 capitalize">{user?.fullName?.split(' ')[0] || 'User'}</span>
                    <span className="text-2xl animate-wave origin-bottom-right">👋</span>
                </h2>
            </div>

            {/* Right User Controls */}
            <div className="flex items-center gap-5">
                {/* Search Interaction */}
                <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="hidden sm:flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all shadow-sm group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    <span className="text-xs font-bold uppercase tracking-wider">Search...</span>
                    <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </button>

                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={cn(
                            "p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all shadow-sm relative",
                            isPinging && "animate-bounce text-blue-600 bg-blue-50"
                        )}
                    >
                        <Bell size={20} className={cn(isPinging && "animate-pulse")} />
                        {/* Unread badge indicator */}
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-in zoom-in duration-300"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotifOpen && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Notifikasi</h3>
                                {unreadCount > 0 && (
                                    <button onClick={handleMarkAllRead} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Tandai dibaca
                                    </button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {unreadCount === 0 ? (
                                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                                        Tidak ada notifikasi baru.
                                    </div>
                                ) : (
                                    notifications.map((notif: any) => (
                                        <div 
                                            key={notif.id} 
                                            onClick={() => handleMarkRead(notif.id, notif.link)}
                                            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex justify-between gap-2">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-blue-600 transition-colors">{notif.title}</p>
                                                {!notif.is_read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5 animate-pulse"></div>}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 pl-5 border-l border-slate-200 dark:border-slate-700/50 hover:opacity-80 transition-all focus:outline-none group"
                    >
                        <div className="h-10 w-10 aspect-square rounded-full bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/50 dark:to-sky-900/50 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold overflow-hidden shrink-0 shadow-sm group-hover:ring-2 ring-blue-500/20 transition-all">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                (user?.fullName?.charAt(0) || 'U').toUpperCase()
                            )}
                        </div>
                        <div className="text-left hidden md:block group-hover:translate-x-0.5 transition-transform">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{user?.fullName || 'User'}</p>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5">{user?.baseRole.replace('_', ' ')}</p>
                        </div>
                        <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-300", isProfileOpen && "rotate-180")} />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute top-full right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Signed in as</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.email}</p>
                            </div>
                            
                            <div className="p-2">
                                <Link 
                                    href="/dashboard/profile"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-400 rounded-xl transition-all"
                                >
                                    <UserIcon size={18} /> My Profile
                                </Link>
                                <Link 
                                    href="/dashboard/settings"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-400 rounded-xl transition-all"
                                >
                                    <Settings size={18} /> Settings
                                </Link>
                                
                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2"></div>
                                
                                <button 
                                    onClick={() => { logout(); setIsProfileOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                                >
                                    <LogOut size={18} /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Search Modal */}
            <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </header>
    )
}