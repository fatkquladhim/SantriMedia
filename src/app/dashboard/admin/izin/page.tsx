'use client'

import { useApi } from '@/hooks/useApi'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { 
    Moon, 
    Clock, 
    User, 
    MapPin, 
    CheckCircle2, 
    AlertCircle, 
    Calendar,
    Activity
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

export default function GlobalIzinMonitorPage() {
    // Fetch ALL permits (admin view)
    const { data: izinData, isLoading } = useApi('/izin', { immediate: true })

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: 'user',
            header: 'Santri',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shadow-inner">
                        <User size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 leading-none">{row.original.user?.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase mt-1 tracking-tight">ID: {row.original.user?.id.substring(0, 8)}</p>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'tanggal',
            header: 'Waktu',
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Calendar size={14} className="text-blue-500" />
                        {new Date(row.original.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                        <Clock size={12} />
                        {row.original.jam_mulai} - {row.original.jam_selesai}
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'tujuan',
            header: 'Tujuan & Alasan',
            cell: ({ row }) => (
                <div className="max-w-[250px]">
                    <div className="flex items-center gap-1.5 text-xs font-black text-blue-700 uppercase tracking-tighter mb-1">
                        <MapPin size={12} />
                        {row.original.tujuan}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic">
                        "{row.original.alasan}"
                    </p>
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status Izin',
            cell: ({ row }) => {
                const status = row.original.status
                const config: any = {
                    pending: { label: 'Validasi Kantor', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Activity },
                    approved_staf: { label: 'Menunggu Kamar', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
                    approved: { label: 'IZIN AKTIF', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 },
                    rejected: { label: 'DITOLAK', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertCircle },
                }
                const s = config[status] || { label: status, color: 'bg-slate-100', icon: AlertCircle }
                return (
                    <Badge className={`${s.color} border py-1.5 px-3 rounded-xl font-black text-[10px] gap-2 flex w-fit uppercase tracking-widest`}>
                        <s.icon size={12} />
                        {s.label}
                    </Badge>
                )
            }
        }
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-blue-900/10 border border-white/10">
                        <Moon size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Monitor Izin Global</h1>
                        <p className="text-slate-500 font-medium">Pemantauan real-time seluruh santri yang lembur malam.</p>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-4 border-white shadow-sm">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Lembur Aktif</p>
                            <p className="text-2xl font-black text-blue-600 leading-none">
                                {izinData?.data?.filter((i: any) => i.status === 'approved').length || 0}
                            </p>
                        </div>
                        <div className="w-[1px] h-8 bg-slate-100"></div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Menunggu</p>
                            <p className="text-2xl font-black text-amber-500 leading-none">
                                {izinData?.data?.filter((i: any) => i.status === 'pending' || i.status === 'approved_staf').length || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-[40px] overflow-hidden border-white shadow-2xl shadow-slate-200/50">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-96 bg-white/50 backdrop-blur-sm">
                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="mt-4 text-blue-800 font-black uppercase tracking-widest text-xs">Memindai Database...</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={izinData?.data || []}
                        searchKey="user" 
                        searchPlaceholder="Cari nama santri..."
                    />
                )}
            </div>

            {/* Info Legend */}
            <div className="grid md:grid-cols-3 gap-6">
                 <div className="p-6 rounded-[30px] bg-white border border-slate-100 shadow-sm flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">Validasi Kantor</h4>
                        <p className="text-xs text-slate-500 mt-1">Tahap awal pengecekan tugas oleh Staf Kantor/Sekre.</p>
                    </div>
                 </div>
                 <div className="p-6 rounded-[30px] bg-white border border-slate-100 shadow-sm flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">Menunggu Kamar</h4>
                        <p className="text-xs text-slate-500 mt-1">Menunggu otorisasi akhir dari Kepala Kamar masing-masing.</p>
                    </div>
                 </div>
                 <div className="p-6 rounded-[30px] bg-white border border-slate-100 shadow-sm flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">Izin Aktif</h4>
                        <p className="text-xs text-slate-500 mt-1">Santri resmi diizinkan lembur dan berada di kantor.</p>
                    </div>
                 </div>
            </div>
        </div>
    )
}