// src/providers/AuthProvider.tsx
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { createClient } from '@/lib/supabase/client'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const fetchUser = useAuthStore((s) => s.fetchUser)
    const user = useAuthStore((s) => s.user)

    useEffect(() => {
        // If user is already hydrated from sessionStorage, skip the initial fetch.
        // AuthProvider will still re-validate on explicit auth events below.
        if (!user) {
            fetchUser()
        }

        // Listen to authentication state changes from Supabase (login, logout, token refresh)
        const supabase = createClient()
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                // Always re-fetch on explicit sign-in or profile change
                fetchUser()
            } else if (event === 'TOKEN_REFRESHED') {
                // Token rotated — clear session cache so next apiFetch uses new token
                import('@/lib/api').then(({ clearSessionCache }) => clearSessionCache())
            } else if (!session) {
                useAuthStore.getState().setUser(null)
                // Clear cached API data on sign-out so a different account
                // does not see the previous user's cached responses.
                import('@/hooks/useApi').then(({ invalidateCache }) => invalidateCache())
            }
        })

        return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <>{children}</>
}
