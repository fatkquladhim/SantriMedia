// src/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useApi } from '@/hooks/useApi'
import { 
    ClipboardList, Moon, Package, Award, ArrowRight, Users, 
    Calendar, Trophy as TrophyIcon, Clock,
    BellDot, Activity, ShieldCheck, Trophy
} from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'

export default function DashboardOverview() {
    const { user, hasAnyPermission } = useAuthStore()
    const isAdmin = user?.baseRole === 'admin'
    const isKepalaKamar = user?.baseRole === 'kepala_kamar'
    const isKetua = hasAnyPermission('ketua_divisi', 'ketua_platform')
    const isSDM = hasAnyPermission('sdm')
    const isStafAlat = hasAnyPermission('staf_alat')
    const isStafKantor = hasAnyPermission('staf_kantor')

    // API Hooks
    const { data: tasksData, fetchData: fetchTasks } = useApi('/tasks?status=todo,in_progress,review', { immediate: false })
    const { data: profilesData, fetchData: fetchProfiles } = useApi('/users', { immediate: false })
    const { data: invData, fetchData: fetchInv } = useApi('/inventaris?is_available=false', { immediate: false })
    const { data: izinData, fetchData: fetchIzin } = useApi('/izin?status=approved', { immediate: false })
    
    // Personal Data Hooks
    const { data: myTasks } = useApi(`/tasks?assigned_to=${user?.id}&status=todo,in_progress,review`, { immediate: !!user })

    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (user) {
            const loaders = [fetchTasks(), fetchProfiles(), fetchInv()]
            if (isKepalaKamar || isStafKantor || isAdmin) loaders.push(fetchIzin())
            Promise.all(loaders).finally(() => setIsLoading(false))
        }
    }, [user])

    if (!user) return null

    // STATS GENERATOR
    const getStats = () => {
        const stats = []
        const myActiveTasks = (myTasks?.data || []).length

        if (isAdmin) {
            stats.push({ title: 'Total Member', value: profilesData?.pagination?.total || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' })
            stats.push({ title: 'Tugas Global', value: tasksData?.pagination?.total || 0, icon: ClipboardList, color: 'text-violet-600', bg: 'bg-violet-50' })
            stats.push({ title: 'Alat Keluar', value: invData?.pagination?.total || 0, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' })
            stats.push({ title: 'Izin Aktif', value: izinData?.pagination?.total || 0, icon: Moon, color: 'text-rose-600', bg: 'bg-rose-50' })
            return stats
        }

        if (isSDM) stats.push({ title: 'Total Member', value: profilesData?.pagination?.total || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' })
        if (isKetua) stats.push({ title: 'Tugas Divisi', value: tasksData?.pagination?.total || 0, icon: ClipboardList, color: 'text-violet-600', bg: 'bg-violet-50' })
        if (isStafAlat) stats.push({ title: 'Alat Keluar', value: invData?.pagination?.total || 0, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' })
        if (isKepalaKamar || isStafKantor) stats.push({ title: 'Izin Aktif', value: izinData?.pagination?.total || 0, icon: Moon, color: 'text-rose-600', bg: 'bg-rose-50' })

        if (stats.length === 0) {
            return [
                { title: 'Poin Saya', value: user.totalPoin || 0, icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { title: 'Tugas Aktif', value: myActiveTasks, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
                { title: 'Rank Media', value: '#12', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
                { title: 'Status Akun', value: 'Aktif', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ]
        }
        return stats.slice(0, 4)
    }

    const currentStats = getStats()

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight uppercase">
                        {isAdmin ? 'System Command' : 
                         isKepalaKamar ? 'Laporan Kamar' :
                         isSDM ? 'SDM Dashboard' :
                         isStafAlat ? 'Logistik' :
                         isStafKantor ? 'Administrasi' :
                         isKetua ? 'Project Dashboard' : `Ahlan wa Sahlan! 👋`}
                    </h1>
                    <p className="text-slate-500 font-medium text-lg flex items-center gap-2">
                        <Calendar size={18} className="text-slate-400" />
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {currentStats.map((stat: any, i) => {
                    const Icon = stat.icon
                    return (
                        <div key={i} className="glass-panel p-8 rounded-[38px] flex items-center gap-6 group hover:-translate-y-2 transition-all duration-500 shadow-xl shadow-slate-200/50 border-white bg-white/60">
                            <div className={`p-5 rounded-3xl ${stat.bg} ${stat.color} shrink-0 shadow-inner group-hover:rotate-12 transition-transform duration-500`}>
                                <Icon size={28} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{stat.title}</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">
                                    {isLoading ? <Skeleton className="h-8 w-16" /> : stat.value}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Bottom Widgets */}
            <div className={`grid gap-8 ${isAdmin ? 'lg:grid-cols-2' : 'lg:grid-cols-4'}`}>
                {/* 1. PERSONAL AREA (HIDDEN FOR ADMIN) */}
                {!isAdmin && (
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                                <ClipboardList size={20} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight font-sans">Agenda Saya</h3>
                        </div>

                        <div className="grid gap-4">
                            <div className="space-y-3">
                                {(myTasks?.data || []).length === 0 ? (
                                    <div className="py-10 border-2 border-dashed border-slate-100 rounded-[35px] text-center bg-slate-50/50">
                                        <p className="text-xs font-bold text-slate-400 italic">Belum ada tugas.</p>
                                    </div>
                                ) : (
                                    (myTasks?.data || []).slice(0, 2).map((task: any) => (
                                        <div key={task.id} className="p-6 rounded-[30px] border border-slate-50 flex items-center gap-5 bg-white shadow-sm hover:shadow-md transition-all">
                                            <div className="w-2 h-10 rounded-full bg-blue-500"></div>
                                            <h4 className="font-bold text-slate-800 text-sm uppercase truncate">{task.judul}</h4>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. MANAGEMENT AREA (VISIBLE FOR ADMIN) */}
                <div className="lg:col-span-2 space-y-8">
                    {(isAdmin || isKepalaKamar || isStafKantor) && (
                        <div className="glass-panel rounded-[40px] p-10 flex flex-col gap-8 bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
                            <h3 className="text-xl font-bold flex items-center gap-3 relative z-10">
                                <Activity className="text-blue-400" size={24} />
                                Monitoring Izin
                            </h3>
                            <div className="relative z-10 space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {(izinData?.data || []).length === 0 ? (
                                    <p className="text-center py-10 text-sm italic opacity-30">Tidak ada santri yang lembur.</p>
                                ) : (
                                    (izinData?.data || []).map((izin: any) => (
                                        <div key={izin.id} className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-[10px]">{izin.user?.full_name?.charAt(0)}</div>
                                                <p className="font-bold text-sm truncate max-w-[150px]">{izin.user?.full_name}</p>
                                            </div>
                                            <Badge className="bg-blue-500/20 text-blue-400 border-none">LIVE</Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                            <button 
                                onClick={() => window.location.href='/dashboard/approval/izin'}
                                className="mt-auto w-full h-14 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                                Kelola Izin <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}