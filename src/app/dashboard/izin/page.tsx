'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Plus, Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, Info, History } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Badge } from '@/components/ui/Badge'

export default function IzinPage() {
    const { user } = useAuthStore()
    const isAdmin = user?.baseRole === 'admin'

    // Endpoint respects the backend logic: standard user fetches only theirs. Admin/staf sees all.
    const { data, isLoading, error, fetchData } = useApi('/izin', { immediate: false })

    useEffect(() => {
        if (user) {
            if (isAdmin) {
                window.location.href = '/dashboard'
                return
            }
            fetchData()
        }
    }, [user, fetchData, isAdmin])

    const izinList = data?.data || []

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        alasan: 'Tugas Multimedia',
        tujuan: 'Kantor Multimedia',
        jam_keluar: '',
        estimasi_kembali: ''
    })
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!formData.jam_keluar || !formData.estimasi_kembali) {
            alert('Harap isi jam mulai dan estimasi selesai')
            return
        }

        setSubmitting(true)
        try {
            // Create proper Date objects for Local -> UTC conversion
            const now = new Date()

            const [hKeluar, mKeluar] = formData.jam_keluar.split(':').map(Number)
            const dateKeluar = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hKeluar, mKeluar)

            const [hKembali, mKembali] = formData.estimasi_kembali.split(':').map(Number)
            const dateKembali = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hKembali, mKembali)

            // If return time is earlier than start time, assume it's for the next day
            if (dateKembali < dateKeluar) {
                dateKembali.setDate(dateKembali.getDate() + 1)
            }

            const payload = {
                ...formData,
                jam_keluar: dateKeluar.toISOString(),
                estimasi_kembali: dateKembali.toISOString()
            }

            await apiFetch('/izin', {
                method: 'POST',
                body: JSON.stringify(payload)
            })
            setIsModalOpen(false)
            setFormData({ alasan: 'Tugas Multimedia', tujuan: 'Kantor Multimedia', jam_keluar: '', estimasi_kembali: '' })
            fetchData()
        } catch (err) {
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }


    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Izin Keluar / Bermalam</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Ajukan izin dan pantau status persetujuan secara real-time.</p>
                </div>
                <Button
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-transform active:scale-95"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={18} /> Pengajuan Baru
                </Button>
            </div>


            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Form Pengajuan Izin"
                description="Pastikan alasan dan durasi izin sudah sesuai dengan peraturan."
                size="lg"
            >
                <div className="space-y-5 pt-2">
                    <div className="space-y-2 focus-within:text-blue-700 transition-colors">
                        <label className="text-sm font-bold text-slate-700 ml-1">Keperluan / Alasan Izin</label>
                        <textarea
                            className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all resize-none shadow-inner"
                            placeholder="Contoh: Sakit / Kepentingan Keluarga mendesak..."

                            value={formData.alasan}
                            onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Tujuan"
                        placeholder="Contoh: Kantor Multimedia"
                        value={formData.tujuan}
                        onChange={(e) => setFormData({ ...formData, tujuan: e.target.value })}
                        className="rounded-xl"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="time"
                            label="Jam Mulai Izin"
                            value={formData.jam_keluar}
                            onChange={(e) => setFormData({ ...formData, jam_keluar: e.target.value })}
                            className="rounded-xl"
                        />
                        <Input
                            type="time"
                            label="Estimasi Jam Selesai"
                            value={formData.estimasi_kembali}
                            onChange={(e) => setFormData({ ...formData, estimasi_kembali: e.target.value })}
                            className="rounded-xl"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button variant="outline" className="rounded-xl px-6" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button onClick={handleSubmit} isLoading={submitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 px-8 text-white shadow-md">
                            Kirim Pengajuan
                        </Button>
                    </div>

                </div>
            </Modal>



            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <History size={20} className="text-blue-500" />
                    <h2 className="text-xl font-bold text-slate-800">Riwayat Pengajuan</h2>
                </div>


                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center gap-3">
                        <AlertCircle size={20} />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="h-40 glass-panel rounded-3xl animate-pulse bg-slate-100/50"></div>
                        ))
                    ) : izinList.length === 0 ? (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center glass-panel rounded-[2rem] border-dashed border-2">
                            <div className="p-5 bg-slate-50 rounded-full mb-4">
                                <MapPin size={40} className="text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-medium">Belum ada riwayat pengajuan izin.</p>
                        </div>
                    ) : (
                        izinList.map((izin: any) => (
                            <div key={izin.id} className="group glass-panel p-5 rounded-3xl border border-slate-200/60 bg-white/40 hover:bg-white hover:border-blue-300 transition-all duration-300 flex flex-col shadow-sm hover:shadow-md">
                                <div className="flex justify-between items-start mb-4">

                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                            <Calendar size={14} />
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                {format(new Date(izin.jam_keluar), 'dd MMM yyyy', { locale: id })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                                            <Clock size={14} />
                                            <span className="text-xs">
                                                {format(new Date(izin.jam_keluar), 'HH:mm')} - {izin.estimasi_kembali ? format(new Date(izin.estimasi_kembali), 'HH:mm') : '?'} (Selesai)
                                            </span>
                                        </div>

                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${izin.status === 'approved'
                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                        : izin.status === 'rejected'
                                            ? 'bg-rose-50 text-rose-600 border-rose-100'
                                            : 'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                        {izin.status === 'approved' ? 'Disetujui' :
                                            izin.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                                    </span>
                                </div>

                                <div className="space-y-3 flex-1">
                                    <div className="flex items-start gap-2">
                                        <div className="mt-1 p-1 bg-slate-100 rounded-md">
                                            <MapPin size={12} className="text-slate-400" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 line-clamp-1">{izin.tujuan || 'Tanpa Tujuan'}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100 group-hover:bg-white transition-colors italic">
                                        "{izin.alasan}"
                                    </p>
                                </div>

                                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-500">
                                            {izin.user?.nama?.charAt(0) || 'U'}
                                        </div>
                                        <span className="text-[10px] font-medium text-slate-400">Pendaftar</span>
                                    </div>
                                    {izin.status === 'approved' ? (
                                        <CheckCircle2 size={16} className="text-blue-500" />
                                    ) : izin.status === 'rejected' ? (
                                        <XCircle size={16} className="text-rose-500" />
                                    ) : (
                                        <AlertCircle size={16} className="text-amber-500" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
