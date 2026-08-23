'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import DashboardTab from '@/features/staff-alat/components/DashboardTab'
import DataAlatTab from '@/features/staff-alat/components/DataAlatTab'
import SewaTab from '@/features/staff-alat/components/SewaTab'
import TarifTab from '@/features/staff-alat/components/TarifTab'
import ProfilKasTab from '@/features/staff-alat/components/ProfilKasTab'
import { LayoutDashboard, Boxes, ClipboardList, Tag, User, X, Wrench } from 'lucide-react'

type TabKey = 'dashboard' | 'alat' | 'sewa' | 'tarif' | 'profil'

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'alat', label: 'Data Alat', icon: Boxes },
    { key: 'sewa', label: 'Transaksi Sewa', icon: ClipboardList },
    { key: 'tarif', label: 'Tarif Harga', icon: Tag },
    { key: 'profil', label: 'Profil & Kas', icon: User },
]

function getInitialTab(): TabKey {
    if (typeof window === 'undefined') return 'dashboard'
    const param = new URLSearchParams(window.location.search).get('tab')
    if (param && TABS.some((t) => t.key === param)) return param as TabKey
    return 'dashboard'
}

export default function StaffAlatPage() {
    const router = useRouter()
    const { hasAnyPermission } = useAuthStore()
    const [tab, setTab] = useState<TabKey>(getInitialTab)

    const allowed = hasAnyPermission('staf_alat')

    const switchTab = (next: TabKey) => {
        setTab(next)
        const url = new URL(window.location.href)
        url.searchParams.set('tab', next)
        window.history.replaceState(null, '', url.toString())
    }

    if (!allowed) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center border border-rose-100 shadow-inner">
                    <X size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Akses Ditolak</h2>
                <p className="text-slate-500 max-w-sm">Mohon maaf, halaman ini hanya dapat diakses oleh Staf Alat (Mediatech) atau Admin.</p>
                <Link href="/dashboard" prefetch={true} className="rounded-xl px-8 bg-slate-800 text-white">
                    Kembali ke Dashboard
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Page header */}
            <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white shadow-xl border border-white/10">
                    <Wrench size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase leading-none">Staff Alat</h1>
                    <p className="text-slate-500 font-medium mt-1">Modul Pengelolaan Inventaris, Penyewaan, Tarif & Kas Mediatech.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => switchTab(key)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                            tab === key
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                    >
                        <Icon size={15} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {tab === 'dashboard' && (
                <DashboardTab onNavigate={(t) => switchTab(t)} />
            )}
            {tab === 'alat' && (
                <DataAlatTab />
            )}
            {tab === 'sewa' && (
                <SewaTab />
            )}
            {tab === 'tarif' && (
                <TarifTab />
            )}
            {tab === 'profil' && (
                <ProfilKasTab />
            )}
        </div>
    )
}
