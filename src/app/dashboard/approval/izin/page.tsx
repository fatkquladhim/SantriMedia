'use client'

import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Check, X, Clock, FileText, RefreshCw, Calendar, CheckCircle2, History, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { ColumnDef } from '@tanstack/react-table'

export default function ApprovalIzinPage() {
    const { user, hasPermission } = useAuthStore()
    const { data: izinData, isLoading, error, fetchData } = useApi('/izin?mode=management', { immediate: true })
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const isAdmin = user?.baseRole === 'admin'
    const isStaf = hasPermission('staf_kantor') || isAdmin
    const isKamar = user?.baseRole === 'kepala_asrama' || isAdmin

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        let catatan = null;
        if (action === 'reject') {
            catatan = prompt('Masukkan alasan penolakan (opsional):');
            if (catatan === null) return; 
        }

        setActionLoading(id)
        try {
            await apiFetch(`/izin/${id}/${action}`, { 
                method: 'PATCH',
                body: JSON.stringify({ catatan })
            })
            fetchData()
        } catch (err) {
            console.error(err)
        } finally {
            setActionLoading(null)
        }
    }

    if (!isStaf && !isKamar && !isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center border border-rose-100 shadow-inner">
                    <X size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Akses Ditolak</h2>
                <p className="text-slate-500 max-w-sm">Mohon maaf, halaman ini hanya dapat diakses oleh Staf Kantor Pesantren.</p>
                <Button onClick={() => window.location.href = '/dashboard'} className="rounded-xl px-8 bg-slate-800 text-white">Kembali ke Dashboard</Button>
            </div>
        )
    }

    // LIST FILTERING
    // Backend handles list filtering automatically based on user role, 
    // but we can ensure double safety here.
    const pendingIzin = izinData?.data?.filter((i: any) => i.status === 'pending') || []
    
    const historyIzin = izinData?.data?.filter((i: any) => 
        i.status === 'approved' || i.status === 'rejected'
    ) || []


    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'approved': return 'success'
            case 'rejected': return 'error'
            default: return 'warning'
        }
    }


    const historyColumns: ColumnDef<any>[] = [
        {
            id: 'pendaftar',
            accessorKey: 'user.full_name',
            header: 'Pemohon',
            cell: ({ row }) => (
                <div>
                    <p className="font-bold text-slate-800 leading-none">{row.original.user?.full_name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">NIS: {row.original.user?.nomor_induk || '-'}</p>
                </div>
            )
        },

        {
            accessorKey: 'alasan',
            header: 'Alasan',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 max-w-[200px]">
                    <FileText size={14} className="text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-600 truncate" title={row.getValue('alasan')}>{row.getValue('alasan')}</span>
                </div>
            )
        },
        {
            accessorKey: 'jam_keluar',
            header: 'Waktu / Tanggal',
            cell: ({ row }) => {
                const start = new Date(row.original.jam_keluar)
                const end = row.original.estimasi_kembali ? new Date(row.original.estimasi_kembali) : null
                return (
                    <div className="flex flex-col">
                        <div className="text-xs text-slate-600 font-bold flex items-center gap-1.5">
                            <Calendar size={12} className="text-blue-400" />
                            {format(start, 'dd MMM yyyy', { locale: id })}
                        </div>
                        <div className="text-[10px] text-blue-500 font-medium mt-1">
                            Mulai: {format(start, 'HH:mm')} - Selesai: {end ? format(end, 'HH:mm') : '?'}
                        </div>
                    </div>
                )
            }
        },

        {
            accessorKey: 'status',
            header: 'Keputusan',
            cell: ({ row }) => {
                const status: string = row.getValue('status')
                return (
                    <Badge variant={getStatusVariant(status)} className="font-bold text-[10px] uppercase tracking-wider px-2 shadow-sm rounded-lg">
                        {status === 'approved' ? 'Disetujui' : status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                    </Badge>

                )
            }
        }
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">Validasi Izin Malam</h1>
                    <p className="text-slate-500 mt-1">Tinjau dan proses permohonan izin santri/staf dengan cepat.</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => fetchData()}
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 shadow-sm border-slate-200"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'} />

                    Refresh Data
                </Button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-rose-50/80 backdrop-blur-sm border border-rose-200 text-rose-700 flex items-center gap-3 shadow-sm">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                {/* Antrean Persetujuan (Left Column) */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-orange-50/50 shadow-sm shadow-amber-100/50 overflow-hidden relative glass-panel">
                        <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-600 pointer-events-none">
                            <Clock size={120} className="-translate-y-8 translate-x-8" />
                        </div>
                        <CardHeader className="pb-4 border-b border-amber-200/50">
                            <CardTitle className="flex items-center gap-2 text-lg text-amber-900">
                                <Clock size={20} className="text-amber-600" />
                                Persetujuan Izin
                            </CardTitle>
                            <CardDescription className="text-amber-800/70 font-medium">
                                Tinjau alasan dan berikan keputusan segera.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-10 opacity-60">
                                    <div className="w-8 h-8 border-4 border-amber-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>

                                    <p className="text-xs text-amber-600 font-medium">Memuat data...</p>
                                </div>
                            ) : pendingIzin.length > 0 ? (
                                pendingIzin.map((izin: any) => (
                                    <div key={izin.id} className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-300 relative overflow-hidden group flex flex-col">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-slate-800 leading-tight pr-2">{izin.user?.full_name}</div>
                                            <Badge variant="warning" className="text-[10px] h-5 bg-amber-50 text-amber-700 border-amber-200 shadow-sm shrink-0">
                                                New
                                            </Badge>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-mono mb-3">NIS: {izin.user?.nomor_induk || '-'}</p>

                                        <div className="bg-amber-50/50 rounded-lg p-3 text-sm text-slate-700 italic border border-amber-100 mb-3 relative">
                                            <FileText size={14} className="absolute top-3 left-3 text-amber-300" />
                                            <span className="pl-6 block line-clamp-3">"{izin.alasan}"</span>
                                        </div>

                                        <div className="flex items-center text-[11px] text-slate-500 gap-2.5 font-bold mb-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={13} className="text-blue-500" />
                                                <span>{format(new Date(izin.jam_keluar), 'dd MMM yyyy')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-blue-600">
                                                <Clock size={13} />
                                                <span>{format(new Date(izin.jam_keluar), 'HH:mm')} - {izin.estimasi_kembali ? format(new Date(izin.estimasi_kembali), 'HH:mm') : '?'}</span>
                                            </div>
                                        </div>


                                        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-slate-100/80">
                                            <Button
                                                variant="outline"
                                                className="flex-1 h-9 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl"
                                                onClick={() => handleAction(izin.id, 'reject')}
                                                disabled={actionLoading === izin.id}
                                            >
                                                <X size={16} className="mr-1" /> Tolak
                                            </Button>
                                            <Button
                                                className="flex-1 h-9 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm shadow-blue-200"
                                                onClick={() => handleAction(izin.id, 'approve')}
                                                isLoading={actionLoading === izin.id}
                                            >
                                                <Check size={16} className="mr-1" /> Setujui Izin
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 opacity-50 bg-white/50 rounded-2xl border border-dashed border-amber-200">
                                    <CheckCircle2 size={40} className="text-amber-400 mb-3" />
                                    <p className="text-xs text-amber-700 font-medium text-center">Semua permohonan telah diproses</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Riwayat Keputusan (Right Column) */}
                <div className="md:col-span-2 space-y-4">
                    {/* Metrics Header */}
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <div className="glass-panel p-4 rounded-3xl flex items-center justify-between border-l-4 border-l-blue-500 shadow-sm">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Disetujui Bulan Ini</p>
                                <p className="text-3xl font-black text-slate-800">{historyIzin.filter((i: any) => i.status === 'approved').length}</p>

                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
                                <Check size={28} />
                            </div>
                        </div>
                        <div className="glass-panel p-4 rounded-3xl flex items-center justify-between border-l-4 border-l-slate-400 shadow-sm">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Riwayat</p>
                                <p className="text-3xl font-black text-slate-800">{historyIzin.length}</p>
                            </div>
                            <div className="p-3 bg-slate-100 text-slate-500 rounded-2xl shadow-inner">
                                <History size={28} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-1">
                        {isLoading ? (
                            <div className="flex flex-col justify-center items-center h-64">
                                <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin"></div>
                                <p className="mt-4 text-slate-500 font-medium tracking-wide">Memuat Riwayat Izin...</p>
                            </div>
                        ) : (
                            <DataTable
                                columns={historyColumns}
                                data={historyIzin || []}
                                searchKey="pendaftar"
                                searchPlaceholder="Cari nama pemohon..."

                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}