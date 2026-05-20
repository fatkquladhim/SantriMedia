// src/stores/authStore.ts
import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

// ===== Types =====
export type BaseRole = 'admin' | 'kepala_asrama' | 'user'

export type DynamicPermission =
    | 'ketua_divisi'     // DP-1
    | 'ketua_platform'   // DP-2
    | 'staf_kantor'      // DP-3
    | 'staf_alat'        // DP-4
    | 'sdm'              // DP-5

export interface UserProfile {
    id: string
    fullName: string
    email: string
    nomorInduk?: string | null // Deprecated - Removing NIS
    avatarUrl: string | null
    baseRole: BaseRole
    dynamicPermissions: DynamicPermission[]
    divisiId: string | null
    divisiNama: string | null
    kamarId: string | null
    isProfileComplete: boolean
    bio?: string | null
    totalPoin: number
}

interface AuthState {
    user: UserProfile | null
    isLoading: boolean
    isAuthenticated: boolean

    // Actions
    fetchUser: () => Promise<void>
    setUser: (user: UserProfile | null) => void
    logout: () => Promise<void>
    hasPermission: (permission: DynamicPermission) => boolean
    hasRole: (role: BaseRole) => boolean
    hasAnyPermission: (...permissions: DynamicPermission[]) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    fetchUser: async () => {
        try {
            set({ isLoading: true })
            const { apiFetch } = await import('@/lib/api')
            const supabase = createClient()

            // 1. Check if we have a session
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                set({ user: null, isAuthenticated: false, isLoading: false })
                return
            }

            // 2. Fetch fresh profile & permissions from backend
            // Using apiFetch ensures we go through backend authGuard and get fresh DB data
            const res = await apiFetch('/auth/me')
            const profile = res.data || res

            if (profile) {
                const userProfile: UserProfile = {
                    id: profile.id,
                    fullName: profile.full_name,
                    email: profile.email,
                    avatarUrl: profile.avatar_url,
                    baseRole: profile.base_role as BaseRole,
                    dynamicPermissions: (profile.dynamic_permissions || []).map(
                        (p: string) => p as DynamicPermission
                    ),
                    divisiId: profile.divisi_id,
                    divisiNama: profile.divisi?.nama || null,
                    kamarId: profile.kamar_id,
                    isProfileComplete: profile.is_profile_complete,
                    bio: profile.bio || null,
                    totalPoin: profile.total_poin || 0,
                }
                set({ user: userProfile, isAuthenticated: true, isLoading: false })
            }
        } catch (error) {
            console.error('Error fetching user:', error)
            set({ user: null, isAuthenticated: false, isLoading: false })
        }
    },

    setUser: (user) =>
        set({ user, isAuthenticated: !!user, isLoading: false }),

    logout: async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        set({ user: null, isAuthenticated: false, isLoading: false })
    },

    // ===== Permission Helpers =====
    hasPermission: (permission) => {
        const { user } = get()
        if (!user) return false
        if (user.baseRole === 'admin') return true // Admin bypass
        return user.dynamicPermissions.includes(permission)
    },

    hasRole: (role) => {
        const { user } = get()
        if (!user) return false
        if (user.baseRole === 'admin') return true // Admin bypass
        return user.baseRole === role
    },

    hasAnyPermission: (...permissions) => {
        const { user } = get()
        if (!user) return false
        if (user.baseRole === 'admin') return true
        return permissions.some((p) => user.dynamicPermissions.includes(p))
    },
}))
