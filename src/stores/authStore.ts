// src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'

// ===== Types =====
export type BaseRole = 'admin' | 'kepala_asrama' | 'user'

export type DynamicPermission =
    | 'ketua_divisi'     // DP-1
    | 'staf_kantor'      // DP-3
    | 'staf_alat'        // DP-4
    | 'sdm'              // DP-5

export interface UserProfile {
    id: string
    fullName: string
    email: string
    nomorInduk?: string | null
    alamat?: string | null
    noHp?: string | null
    avatarUrl: string | null
    baseRole: BaseRole
    dynamicPermissions: DynamicPermission[]
    divisiId: string | null
    divisiNama: string | null
    asramaId: string | null
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

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            // Start as false — if user is in sessionStorage, persist middleware
            // hydrates user/isAuthenticated synchronously before first render,
            // so we never need a loading spinner on page refresh.
            isLoading: false,
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
                    nomorInduk: profile.nomor_induk || null,
                    alamat: profile.alamat || null,
                    noHp: profile.no_hp || null,
                avatarUrl: profile.avatar_url,
                    baseRole: profile.base_role as BaseRole,
                    dynamicPermissions: (profile.dynamic_permissions || []).map(
                        (p: string) => p as DynamicPermission
                    ),
                    divisiId: profile.divisi_id,
                    divisiNama: profile.divisi?.nama || null,
                    asramaId: profile.asrama_id,
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
        // Clear session cache from api.ts
        const { clearSessionCache } = await import('@/lib/api')
        clearSessionCache()
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
        }),
        {
            name: 'auth-storage',
            // Use sessionStorage instead of localStorage for better security
            // Data persists across page refreshes but cleared when tab closes
            storage: {
                getItem: (name) => {
                    if (typeof window === 'undefined') return null
                    const str = sessionStorage.getItem(name)
                    return str ? JSON.parse(str) : null
                },
                setItem: (name, value) => {
                    if (typeof window === 'undefined') return
                    sessionStorage.setItem(name, JSON.stringify(value))
                },
                removeItem: (name) => {
                    if (typeof window === 'undefined') return
                    sessionStorage.removeItem(name)
                },
            },
            // Only persist user state, not loading/error states
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }) as AuthState,
        }
    )
)
