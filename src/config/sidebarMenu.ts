// src/config/sidebarMenu.ts
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    Moon,
    Package,
    BarChart3,
    Award,
    Building2,
    Monitor,
    Shield,
    Bot,
    BookOpen,
    Settings,
    type LucideIcon,
} from 'lucide-react'
import type { BaseRole, DynamicPermission } from '@/stores/authStore'

export interface SidebarMenuItem {
    id: string
    label: string
    icon: LucideIcon
    href: string
    // Base role filter
    roles?: BaseRole[]
    // Dynamic permission filter
    permissions?: DynamicPermission[]
    // Admin only
    adminOnly?: boolean
}

export interface SidebarMenuGroup {
    id: string
    label: string
    items: SidebarMenuItem[]
}

export const sidebarMenuConfig: SidebarMenuGroup[] = [
    // ===== MAIN =====
    {
        id: 'main',
        label: 'Menu Utama',
        items: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                icon: LayoutDashboard,
                href: '/dashboard',
            },
            {
                id: 'tasks',
                label: 'Task Board',
                icon: ClipboardList,
                href: '/dashboard/tasks',
                roles: ['user'],
            },
            {
                id: 'izin',
                label: 'Izin Malam',
                icon: Moon,
                href: '/dashboard/izin',
                roles: ['user'],
            },
            {
                id: 'inventaris',
                label: 'Inventaris Alat',
                icon: Package,
                href: '/dashboard/inventaris',
                roles: ['user'],
            },
        ],
    },

    // ===== MODUL KHUSUS (Dynamic Permissions) =====
    {
        id: 'special',
        label: 'Modul Khusus',
        items: [
            {
                id: 'approval-izin',
                label: 'Approval Izin',
                icon: Moon,
                href: '/dashboard/approval/izin',
                roles: ['kepala_asrama'],
                permissions: ['staf_kantor'],
            },
            {
                id: 'approval-inventaris',
                label: 'Kelola Inventaris',
                icon: Package,
                href: '/dashboard/admin/inventaris',
                roles: ['admin'],
                permissions: ['staf_alat'],
            },
            {
                id: 'kepegawaian',
                label: 'Kepegawaian & Grading',
                icon: BarChart3,
                href: '/dashboard/sdm',
                permissions: ['sdm'],
            },
        ],
    },

    // ===== PENGASUHAN =====
    {
        id: 'asrama',
        label: 'Pengasuhan',
        items: [
            {
                id: 'buku-penghubung',
                label: 'Buku Penghubung',
                icon: BookOpen,
                href: '/dashboard/asrama/buku-penghubung',
                roles: ['kepala_asrama'],
            },
            {
                id: 'evaluasi-asrama',
                label: 'Evaluasi Santri',
                icon: Award,
                href: '/dashboard/asrama/evaluasi',
                roles: ['kepala_asrama'],
            },
        ],
    },

    // ===== SISTEM & ADM =====
    {
        id: 'admin',
        label: 'Sistem & SDM',
        items: [
            {
                id: 'manage-users',
                label: 'Manajemen Akses',
                icon: Shield,
                href: '/dashboard/admin/access',
                roles: ['admin'],
            },
            {
                id: 'ai-agent',
                label: 'AI Agent Panel',
                icon: Bot,
                href: '/dashboard/admin/ai',
                adminOnly: true,
            },
        ],
    },

    // ===== DATA MASTER =====
    {
        id: 'master',
        label: 'Data Master',
        items: [
            {
                id: 'master-divisi',
                label: 'Struktur Divisi',
                icon: Building2,
                href: '/dashboard/admin/divisi',
                adminOnly: true,
            },
            {
                id: 'master-asrama',
                label: 'Hunian Asrama',
                icon: Building2,
                href: '/dashboard/admin/asrama',
                adminOnly: true,
            },
        ],
    },
]
