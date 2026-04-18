// src/components/layout/DashboardLayout.tsx
'use client'

import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuthStore } from '@/stores/authStore'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isAuthenticated } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login')
        }
    }, [isLoading, isAuthenticated, router])

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="flex h-[100dvh] overflow-hidden bg-transparent">
            {/* The Sidebar has fixed positioning and custom margins */}
            <Sidebar />

            <div className="flex flex-col flex-1 min-w-0 bg-transparent">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    <div className="mx-auto max-w-[1400px]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}