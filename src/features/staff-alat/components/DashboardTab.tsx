'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApi, invalidateCache } from '@/hooks/useApi'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Alat, Sewa, StaffAlatProfil, mapAlatFromApi, mapSewaFromApi, mapProfilFromApi } from '@/features/staff-alat/lib/staffAlatTypes'
import {
    calculateRentedCountForTool,
    calculateTotalRentedUnitsOnDashboard,
    daysBetween,
    formatRupiah,
} from '@/features/staff-alat/lib/staffAlatUtils'
import { Package, Clock, Wrench, TrendingUp, AlertTriangle, CheckCircle2, Eye, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface DashboardTabProps {
    onNavigate: (tab: 'alat' | 'sewa') => void
}

export default function DashboardTab({ onNavigate }: DashboardTabProps) {
    const [viewImage, setViewImage] = useState<{ src: string; name: string } | null>(null)

    const { data: alatRes, isLoading: isLoadingAlat, fetchData: fetchAlat } = useApi('/inventaris?limit=100', { immediate: false })
    const { data: sewaRes, isLoading: isLoadingSewa, fetchData: fetchSewa } = useApi('/staff-alat/sewa?limit=100', { immediate: false })
    const { data: profilRes, isLoading: isLoadingProfil, fetchData: fetchProfil } = useApi('/staff-alat/profil', { immediate: false })

    const alat: Alat[] = useMemo(() => (alatRes?.data || []).map(mapAlatFromApi), [alatRes])
    const sewa: Sewa[] = useMemo(() => (sewaRes?.data || []).map(mapSewaFromApi), [sewaRes])
    const profil: StaffAlatProfil | null = useMemo(() => (profilRes?.data ? mapProfilFromApi(profilRes.data) : null), [profilRes])

    const isLoading = isLoadingAlat || isLoadingSewa || isLoadingProfil

    useEffect(() => {
        fetchAlat()
        fetchSewa()
        fetchProfil()
    }, [fetchAlat, fetchSewa, fetchProfil])

    const handleNavigate = (t: 'alat' | 'sewa') => {
        invalidateCache('/inventaris?limit=100')
        invalidateCache('/staff-alat/sewa?limit=100')
        invalidateCache('/inventaris/kategori')
        onNavigate(t)
    }

    const todayStr = new Date().toISOString().slice(0, 10)

    const stats = useMemo(() => {
        const totalAlat = alat.reduce((sum, a) => sum + (a.jumlah || 1), 0)
        const totalRentedUnits = calculateTotalRentedUnitsOnDashboard(sewa)
        const damagedAlat = alat.filter(
            (a) => a.kondisi === 'rusak_ringan' || a.kondisi === 'rusak_berat' || a.kondisi === 'maintenance' || a.kondisi === 'hilang'
        )
        const criticalSewa = sewa.filter((s) => {
            if (s.status === 'Lunas' || s.statusPengembalian === 'Sudah Mengembalikan') return false
            const daysLeft = daysBetween(todayStr, s.tanggalPengembalian)
            return daysLeft <= 1 || s.status === 'Terlambat'
        })
        const rentedAlatWithQty = alat
            .map((a) => ({ tool: a, rentedQty: calculateRentedCountForTool(a, sewa) }))
            .filter((item) => item.rentedQty > 0)
        return { totalAlat, totalRentedUnits, damagedAlat, criticalSewa, rentedAlatWithQty }
    }, [alat, sewa, todayStr])

    if (isLoading && alat.length === 0 && sewa.length === 0 && !profil) {
        return (
            <div className="space-y-6">
                <div className="grid md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                    <Skeleton className="h-80 rounded-2xl" />
                    <Skeleton className="h-80 rounded-2xl" />
                </div>
            </div>
        )
    }

    const condStyles: Record<string, string> = {
        baik: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        rusak_ringan: 'bg-amber-50 text-amber-700 border-amber-200',
        rusak_berat: 'bg-rose-50 text-rose-700 border-rose-200',
        maintenance: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        hilang: 'bg-sky-50 text-sky-700 border-sky-200',
    }

    const statCards = [
        { label: 'Total Inventaris', value: `${stats.totalAlat} Unit`, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Sedang Disewa', value: `${stats.totalRentedUnits} Unit`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Rusak / Perbaikan', value: `${stats.damagedAlat.length} Unit`, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Saldo Uang Alat', value: formatRupiah(profil?.uangAlat || 0), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Dashboard Staff Alat</h2>
                    <p className="text-slate-500 font-medium text-sm mt-0.5">
                        Sistem Informasi Pengelolaan Inventaris, Penyewaan, dan Kas Mediatech.
                    </p>
                </div>
                <div className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">
                    Tanggal Sistem: <span className="text-emerald-600 font-bold">{todayStr}</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.label} className="p-5 flex items-center gap-4 rounded-2xl">
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-xl font-black text-slate-900 truncate">{stat.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Deadline & Rented */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Urgent deadlines */}
                <Card className="p-6 rounded-2xl flex flex-col min-h-[300px]">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={20} className="text-amber-500" />
                        <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight">Deadline Pengembalian & Terlambat</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3 pr-1">
                        {stats.criticalSewa.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                <CheckCircle2 size={40} className="text-emerald-400 mb-2" />
                                <p className="text-sm font-bold text-slate-700">Semua aman!</p>
                                <p className="text-xs text-slate-500">Tidak ada penyewa yang mendekati deadline atau terlambat.</p>
                            </div>
                        ) : (
                            stats.criticalSewa.map((s) => {
                                const daysLeft = daysBetween(todayStr, s.tanggalPengembalian)
                                const isOverdue = daysLeft < 0 || s.status === 'Terlambat'
                                const barang = (s.items || []).map((i) => i.namaAlat || i.alat?.nama || '(alat terhapus)').join(', ')
                                return (
                                    <div
                                        key={s.id}
                                        className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                                            isOverdue ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
                                        }`}
                                    >
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-slate-900">{s.namaPenyewa}</span>
                                                <Badge variant={isOverdue ? 'error' : 'warning'} className="font-black uppercase tracking-wider">
                                                    {isOverdue ? 'Terlambat' : 'Mendekati Deadline'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-600 truncate max-w-[300px]">Barang: <span className="font-semibold">{barang}</span></p>
                                            <p className="text-[11px] font-mono text-slate-500">
                                                Batas: {s.tanggalPengembalian} ({isOverdue ? `Terlambat ${Math.abs(daysLeft)} hari` : 'Besok / Hari ini'})
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="font-mono text-xs font-bold text-slate-900 block">{formatRupiah(s.hargaSewa)}</span>
                                            <button
                                                onClick={() => onNavigate('sewa')}
                                                className="text-[10px] font-bold text-sky-600 hover:underline mt-2 inline-flex items-center"
                                            >
                                                Detail <ChevronRight size={12} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </Card>

                {/* Rented items */}
                <Card className="p-6 rounded-2xl flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock size={20} className="text-purple-500" />
                            <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight">Alat yang Sedang Disewa</h3>
                        </div>
                        <Badge className="bg-purple-50 text-purple-700 border-purple-200 font-black">{stats.totalRentedUnits} Unit</Badge>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3 pr-1">
                        {stats.rentedAlatWithQty.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                <Package size={40} className="text-slate-300 mb-2" />
                                <p className="text-sm font-bold text-slate-700">Gudang penuh!</p>
                                <p className="text-xs text-slate-500">Semua alat multimedia saat ini berada di sekretariat.</p>
                            </div>
                        ) : (
                            stats.rentedAlatWithQty.map(({ tool: a, rentedQty }) => {
                                const renters = sewa
                                    .filter((s) => (s.items || []).some((i) => i.alatId === a.id))
                                    .map((s) => s.namaPenyewa)
                                const renterNames = Array.from(new Set(renters)).join(', ')
                                const nearestReturn = renters.length > 0
                                    ? sewa.filter((s) => (s.items || []).some((i) => i.alatId === a.id)).map((s) => s.tanggalPengembalian).sort()[0]
                                    : '-'
                                return (
                                    <div
                                        key={a.id}
                                        className="p-3 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {a.gambar ? (
                                                <div className="relative group shrink-0">
                                                    <Image
                                                        src={a.gambar}
                                                        alt={a.nama}
                                                        width={40}
                                                        height={40}
                                                        className="w-10 h-10 rounded-lg object-cover cursor-pointer"
                                                        onClick={() => setViewImage({ src: a.gambar as string, name: a.nama })}
                                                        referrerPolicy="no-referrer"
                                                        unoptimized
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                        <Eye size={14} className="text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                                                    <Package size={16} className="text-slate-400" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-semibold text-sm text-slate-900 truncate">{a.nama}</h4>
                                                    <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                                                        {rentedQty} unit
                                                    </span>
                                                </div>
                                                <p className="text-xs text-purple-600 truncate">
                                                    Disewa oleh: <span className="font-semibold">{renterNames || 'Umum'}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[11px] font-mono text-slate-400 block">Batas Pengembalian</span>
                                            <span className="text-xs font-bold font-mono text-amber-500">{nearestReturn}</span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </Card>
            </div>

            {/* Damaged tools */}
            <Card className="p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Wrench size={20} className="text-amber-500" />
                        <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight">Alat Rusak, Perbaikan, & Hilang</h3>
                    </div>
                    <Button variant="link" size="sm" className="text-sky-600 font-bold" onClick={() => handleNavigate('alat')}>
                        Lihat Semua Alat <ChevronRight size={14} />
                    </Button>
                </div>
                {stats.damagedAlat.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center">
                        <CheckCircle2 size={44} className="text-emerald-400 mb-2" />
                        <p className="text-sm font-bold text-slate-700">Kondisi Prima!</p>
                        <p className="text-xs text-slate-500">Semua alat dalam kondisi baik dan siap disewakan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.damagedAlat.map((a) => (
                            <div key={a.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all flex items-start gap-3 min-w-0">
                                {a.gambar ? (
                                    <div className="relative group shrink-0">
                                        <Image
                                            src={a.gambar}
                                            alt={a.nama}
                                            width={48}
                                            height={48}
                                            className="w-12 h-12 rounded-lg object-cover cursor-pointer"
                                            onClick={() => setViewImage({ src: a.gambar as string, name: a.nama })}
                                            referrerPolicy="no-referrer"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <Eye size={14} className="text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                                        <Package size={18} className="text-slate-400" />
                                    </div>
                                )}
                                <div className="min-w-0 space-y-1">
                                    <h4 className="font-semibold text-xs text-slate-900 truncate">{a.nama}</h4>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[9px] bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{a.kategori}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${condStyles[a.kondisi] || 'bg-slate-100 text-slate-600'}`}>
                                            {a.kondisi}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 truncate">{a.keterangan || 'Tanpa keterangan.'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Image preview modal */}
            {viewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-2xl p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={viewImage.src} alt={viewImage.name} className="w-full max-h-[60vh] object-contain rounded-xl" />
                        <p className="text-sm font-bold text-slate-800 mt-3 text-center">{viewImage.name}</p>
                        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setViewImage(null)}>Tutup</Button>
                    </div>
                </div>
            )}
        </div>
    )
}
