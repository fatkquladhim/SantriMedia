// src/stores/sidebarStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SidebarState {
    isOpen: boolean
    isMobileOpen: boolean
    toggle: () => void
    toggleMobile: () => void
    close: () => void
    closeMobile: () => void
}

export const useSidebarStore = create<SidebarState>()(
    persist(
        (set) => ({
            isOpen: true,
            isMobileOpen: false,

            toggle: () => set((state) => ({ isOpen: !state.isOpen })),
            toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
            close: () => set({ isOpen: false }),
            closeMobile: () => set({ isMobileOpen: false }),
        }),
        {
            name: 'sidebar-storage',
            // Ensure this only runs on client side (Next.js SSR compliance)
            storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
                getItem: () => null,
                setItem: () => { },
                removeItem: () => { },
            })),
            partialize: (state) => ({ isOpen: state.isOpen }), // Only persist desktop state
        }
    )
)
