// src/providers/AuthProvider.tsx
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { createClient } from '@/lib/supabase/client'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const fetchUser = useAuthStore((s) => s.fetchUser)

    useEffect(() => {
        // Fetch user on initial mount
        fetchUser()

        // Listen to authentication state changes from Supabase (login, logout, token refresh)
        const supabase = createClient()
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchUser()
            } else {
                useAuthStore.getState().setUser(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [fetchUser])

    return <>{children}</>
}
