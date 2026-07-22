// src/app/dashboard/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import {
    ClipboardList, Moon, Package, Award, ArrowRight, Users,
    Calendar, ShieldCheck, Trophy, Activity, Plus, AlertCircle, CheckCircle2, Clock
} from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { format, isPast } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const STATUS_STYLE: Record<string, string> = {
    todo: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-amber-100 text-amber-700',
    done: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-600',
}

export default function DashboardOverview() {
    const router = useRouter()
    const { user, hasAnyPermission } = useAuthStore()
    const isAdmin = user?.baseRole === 'admin'
    const isKepalaAsrama = user?.baseRole === 'kepala_asrama'
    const isKetua = hasAnyPermission('ketua_divisi')
    const isSDM = hasAnyPermission('sdm')
    const isStafAlat = hasAnyPermission('staf_alat')
    const isStafKantor = hasAnyPermission('staf_kantor')

    // API Hooks
    const { data: tasksData, fetchData: fetchTasks } = useApi('/tasks?status=todo,in_progress,review', { immediate: false })
    const { data: profilesData, fetchData: fetchProfiles } = useApi('/users', { immediate: false })
    const { data: invData, fetchData: fetchInv } = useApi('/inventaris?is_available=false', { immediate: false })
    const { data: izinData, fetchData: fetchIzin } = useApi('/izin?status=approved', { immediate: false })
    // Guard: only fetch when user.id is a real UUID, never when it's undefined
    const { data: myTasks } = useApi(
        user?.id ? `/tasks?assigned_to=${user.id}&status=todo,in_progress,review` : '',
        { immediate: !!user?.id }
    )

    // Delegasi data (only fetched for ketua)
    const { data: teamData, isLoading: isTeamLoading } = useApi('/users?divisi_only=true', { immediate: !!isKetua })
    const { data: allTasksData, isLoading: isAllTasksLoading, fetchData: refreshTasks } = useApi('/tasks', { immediate: !!isKetua })

    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [form, setForm] = useState({ judul: '', deskripsi: '', priority: 'medium', poin: 10, assigned_to: '', deadline: '' })

    useEffect(() => {
        if (!user) return
        setIsLoading(true)
        const loaders = [fetchTasks(), fetchProfiles(), fetchInv()]
        if (isKepalaAsrama || isStafKantor || isAdmin) loaders.push(fetchIzin())
        Promise.all(loaders).finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id])

    const members = teamData?.data || []
    const allTasks = allTasksData?.data || []

    const memberTasksMap = useMemo(() => {
        const map: Record<string, any[]> = {}
        allTasks.forEach((t: any) => {
            if (t.assigned_to) {
                if (!map[t.assigned_to]) map[t.assigned_to] = []
                map[t.assigned_to].push(t)
            }
        })
        return map
    }, [allTasks])

    const unassignedTasks = useMemo(
        () => allTasks.filter((t: any) => !t.assigned_to && t.status === 'todo'),
        [allTasks]
    )

    if (!user) return null

    const showNotif = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 3000)
    }

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await apiFetch('/tasks', {
                method: 'POST',
                body: JSON.stringify({
                    ...form, poin: Number(form.poin),
                    assigned_to: form.assigned_to || null,
                    deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
                }),
            })
            showNotif('Tugas berhasil ditambahkan')
            setIsModalOpen(false)
            setForm({ judul: '', deskripsi: '', priority: 'medium', poin: 10, assigned_to: '', deadline: '' })
            refreshTasks()
        } catch (err: any) {
            showNotif(err.message || 'Gagal', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const assignTask = async (taskId: string, userId: string) => {
        try {
            await apiFetch(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ assigned_to: userId }) })
            showNotif('Tugas berhasil diinisialisasikan')
            refreshTasks()
        } catch { showNotif('Gagal assign tugas', 'error') }
    }

    // STATS
    const getStats = () => {
        const myActiveTasks = (myTasks?.data || []).length
        if (isAdmin) return [
            { title: 'Total Member', value: profilesData?.pagination?.total || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { title: 'Tugas Global', value: tasksData?.pagination?.total || 0, icon: ClipboardList, color: 'text-violet-600', bg: 'bg-violet-50' },
            { title: 'Alat Keluar', value: invData?.pagination?.total || 0, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
            { title: 'Izin Aktif', value: izinData?.pagination?.total || 0, icon: Moon, color: 'text-rose-600', bg: 'bg-rose-50' },
        ]
        const stats: any[] = []
        if (isSDM) stats.push({ title: 'Total Member', value: profilesData?.pagination?.total || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' })
        if (isKetua) stats.push({ title: 'Tugas Divisi', value: tasksData?.pagination?.total || 0, icon: ClipboardList, color: 'text-violet-600', bg: 'bg-violet-50' })
        if (isStafAlat) stats.push({ title: 'Alat Keluar', value: invData?.pagination?.total || 0, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' })
        if (isKepalaAsrama || isStafKantor) stats.push({ title: 'Izin Aktif', value: izinData?.pagination?.total || 0, icon: Moon, color: 'text-rose-600', bg: 'bg-rose-50' })
        if (stats.length === 0) return [
            { title: 'Poin Saya', value: user.totalPoin || 0, icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { title: 'Tugas Aktif', value: myActiveTasks, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
            { title: 'Rank Media', value: '#12', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
            { title: 'Status Akun', value: 'Aktif', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ]
        return stats.slice(0, 4)
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-bold animate-in slide-in-from-top-4 duration-300 ${notification.type === 'success' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight uppercase">
                        {isAdmin ? 'System Command' :
                            isKepalaAsrama ? 'Laporan Kamar' :
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
                {isKetua && (
                    <Button className="flex items-center gap-2 w-fit" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} /> Tambah Tugas
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {getStats().map((stat: any, i: number) => {
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

            {/* ===== KETUA: SECTION DELEGASI ===== */}
            {isKetua && (
                <div className="space-y-6">
                    {/* Tabel Anggota & Tugas */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users size={18} className="text-blue-600" /> Anggota & Tugas Mereka
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Anggota</TableHead>
                                        <TableHead>Tugas</TableHead>
                                        <TableHead>Deadline</TableHead>
                                        <TableHead>Status Deadline</TableHead>
                                        <TableHead>Status Tugas</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isTeamLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Memuat...</TableCell></TableRow>
                                    ) : members.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Belum ada anggota divisi.</TableCell></TableRow>
                                    ) : members.flatMap((m: any) => {
                                        const memberTasks = memberTasksMap[m.id] || []
                                        if (memberTasks.length === 0) return [(
                                            <TableRow key={m.id} className="bg-slate-50/40">
                                                <TableCell className="font-semibold text-slate-800">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">{m.full_name?.charAt(0)}</div>
                                                        {m.full_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell colSpan={4} className="text-xs text-slate-400 italic">Tidak ada tugas aktif</TableCell>
                                            </TableRow>
                                        )]
                                        return memberTasks.map((t: any, idx: number) => {
                                            const isOverdue = t.deadline && isPast(new Date(t.deadline)) && t.status !== 'done'
                                            return (
                                                <TableRow key={t.id}>
                                                    {idx === 0 && (
                                                        <TableCell rowSpan={memberTasks.length} className="font-semibold text-slate-800 align-top pt-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">{m.full_name?.charAt(0)}</div>
                                                                {m.full_name}
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                    <TableCell className="text-sm text-slate-700 max-w-[200px] truncate">{t.judul}</TableCell>
                                                    <TableCell className="text-xs text-slate-500">
                                                        {t.deadline ? format(new Date(t.deadline), 'dd MMM yyyy', { locale: localeId }) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {!t.deadline ? <span className="text-xs text-slate-400">—</span>
                                                            : isOverdue ? <Badge className="bg-rose-100 text-rose-700 text-[10px]">Terlambat</Badge>
                                                            : <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">On Track</Badge>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`text-[10px] ${STATUS_STYLE[t.status] || 'bg-slate-100 text-slate-600'}`}>
                                                            {t.status.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Tugas Belum Diinisialisasikan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ClipboardList size={18} className="text-amber-600" />
                                Tugas Belum Diinisialisasikan
                                {unassignedTasks.length > 0 && <Badge className="bg-amber-100 text-amber-700 ml-1">{unassignedTasks.length}</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Judul Tugas</TableHead>
                                        <TableHead>Prioritas</TableHead>
                                        <TableHead>Deadline</TableHead>
                                        <TableHead className="text-right">Inisialisasi ke</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isAllTasksLoading ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">Memuat...</TableCell></TableRow>
                                    ) : unassignedTasks.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-6 text-slate-400 italic">Semua tugas sudah diinisialisasikan.</TableCell></TableRow>
                                    ) : unassignedTasks.map((t: any) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="font-medium text-slate-800">{t.judul}</TableCell>
                                            <TableCell>
                                                <Badge className={`text-[10px] ${t.priority === 'urgent' ? 'bg-rose-100 text-rose-700' : t.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {t.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {t.deadline ? format(new Date(t.deadline), 'dd MMM yyyy', { locale: localeId }) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <select
                                                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    defaultValue=""
                                                    onChange={(e) => { if (e.target.value) assignTask(t.id, e.target.value) }}
                                                >
                                                    <option value="" disabled>Pilih anggota...</option>
                                                    {members.map((m: any) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                                                </select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ===== NON-KETUA: PERSONAL + MANAGEMENT AREA ===== */}
            {!isKetua && (
                <div className={`grid gap-8 ${isAdmin ? 'lg:grid-cols-2' : 'lg:grid-cols-4'}`}>
                    {!isAdmin && (
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                                        <ClipboardList size={20} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Agenda Saya</h3>
                                </div>
                                {(myTasks?.data || []).length > 0 && (
                                    <button onClick={() => router.push('/dashboard/tasks')}
                                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                                        Lihat semua <ArrowRight size={13} />
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {(myTasks?.data || []).length === 0 ? (
                                    <div className="py-10 border-2 border-dashed border-slate-100 rounded-[28px] text-center bg-slate-50/50">
                                        <p className="text-xs font-bold text-slate-400 italic">Belum ada tugas yang diberikan.</p>
                                    </div>
                                ) : (myTasks?.data || []).map((task: any) => {
                                    const isOverdue = task.deadline && isPast(new Date(task.deadline))
                                    const statusColor: Record<string, string> = {
                                        todo: 'bg-slate-300',
                                        in_progress: 'bg-blue-500',
                                        review: 'bg-amber-400',
                                        done: 'bg-emerald-400',
                                    }
                                    return (
                                        <div key={task.id} className="p-5 rounded-[24px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                                            <div className={`w-1.5 h-12 rounded-full shrink-0 ${statusColor[task.status] || 'bg-slate-300'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 text-sm truncate">{task.judul}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {task.deadline
                                                            ? format(new Date(task.deadline), 'dd MMM yyyy', { locale: localeId })
                                                            : 'Tanpa deadline'}
                                                    </span>
                                                    {isOverdue && task.status !== 'done' && (
                                                        <span className="text-[9px] font-black text-rose-500 uppercase">Terlambat</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge className={`text-[9px] shrink-0 ${
                                                task.status === 'todo' ? 'bg-slate-100 text-slate-600' :
                                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                task.status === 'review' ? 'bg-amber-100 text-amber-700' :
                                                'bg-emerald-100 text-emerald-700'
                                            }`}>{task.status.replace('_', ' ')}</Badge>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    <div className="lg:col-span-2 space-y-8">
                        {(isAdmin || isKepalaAsrama || isStafKantor) && (
                            <div className="glass-panel rounded-[40px] p-10 flex flex-col gap-8 bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                                <h3 className="text-xl font-bold flex items-center gap-3">
                                    <Activity className="text-blue-400" size={24} /> Monitoring Izin
                                </h3>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {(izinData?.data || []).length === 0 ? (
                                        <p className="text-center py-10 text-sm italic opacity-30">Tidak ada santri yang lembur.</p>
                                    ) : (izinData?.data || []).map((izin: any) => (
                                        <div key={izin.id} className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-[10px]">{izin.user?.full_name?.charAt(0)}</div>
                                                <p className="font-bold text-sm truncate max-w-[150px]">{izin.user?.full_name}</p>
                                            </div>
                                            <Badge className="bg-blue-500/20 text-blue-400 border-none">LIVE</Badge>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => router.push('/dashboard/approval/izin')}
                                    className="mt-auto w-full h-14 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                                    Kelola Izin <ArrowRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== MODAL: Tambah Tugas (Ketua only) ===== */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Tugas Baru" size="lg">
                <form onSubmit={handleAddTask} className="space-y-4">
                    <Input label="Judul Tugas" placeholder="Judul singkat..." value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} required />
                    <div className="grid grid-cols-3 gap-3">
                        <Select label="Prioritas" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                            options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
                        <Input label="Poin" type="number" min={1} value={form.poin} onChange={e => setForm({ ...form, poin: Number(e.target.value) })} />
                        <Input label="Deadline" type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                    </div>
                    <Select label="Assign ke Anggota (opsional)" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                        options={[{ value: '', label: '— Biarkan kosong —' }, ...members.map((m: any) => ({ value: m.id, label: m.full_name }))]} />
                    <div>
                        <label className="text-sm font-medium text-slate-700">Deskripsi</label>
                        <textarea className="mt-1.5 w-full min-h-[80px] p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Instruksi detail..." value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" isLoading={isSubmitting}>Simpan Tugas</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
