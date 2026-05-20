'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import {
    CheckCircle2, Clock, PlayCircle, AlertCircle, Plus, FileText,
    ExternalLink, ShieldCheck, Search, Edit2, Trash2, History
} from 'lucide-react'
import { format, differenceInHours, isPast } from 'date-fns'
import { id } from 'date-fns/locale'

const STATUS_STYLE: Record<string, string> = {
    todo: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-amber-100 text-amber-700',
    done: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-600',
}

// ─── HISTORI VIEW (untuk Ketua) ──────────────────────────────────────────────
function HistoriView() {
    const { user } = useAuthStore()
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const { data, isLoading, fetchData } = useApi('/tasks', { immediate: true })
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const showNotif = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 3000)
    }

    const tasks = (data?.data || []).filter((t: any) => {
        const matchSearch = t.judul.toLowerCase().includes(search.toLowerCase())
        const matchStatus = filterStatus === 'all' || t.status === filterStatus
        return matchSearch && matchStatus
    })

    const handleApprove = async (taskId: string) => {
        try {
            await apiFetch(`/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'done' }) })
            showNotif('Tugas disetujui')
            fetchData()
        } catch (err: any) { showNotif(err.message || 'Gagal', 'error') }
    }

    const handleRevisi = async (taskId: string) => {
        try {
            await apiFetch(`/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'in_progress' }) })
            showNotif('Tugas dikembalikan untuk revisi')
            fetchData()
        } catch (err: any) { showNotif(err.message || 'Gagal', 'error') }
    }

    const handleDelete = async (taskId: string) => {
        if (!confirm('Hapus tugas ini?')) return
        try {
            await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' })
            showNotif('Tugas dihapus')
            fetchData()
        } catch (err: any) { showNotif(err.message || 'Gagal', 'error') }
    }

    return (
        <div className="space-y-6">
            {notification && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-bold animate-in slide-in-from-top-4 duration-300 ${notification.type === 'success' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <History size={28} className="text-blue-600" /> Histori Tugas Anggota
                    </h1>
                    <p className="text-slate-500 mt-1">Semua tugas dari seluruh anggota naungan Anda.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari tugas..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 h-10 w-56 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Semua Status</option>
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Tabel Histori */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tugas</TableHead>
                            <TableHead>Anggota</TableHead>
                            <TableHead>Deadline</TableHead>
                            <TableHead>Status Deadline</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Bukti</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">Memuat histori...</TableCell></TableRow>
                        ) : tasks.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400 italic">Tidak ada tugas ditemukan.</TableCell></TableRow>
                        ) : tasks.map((t: any) => {
                            const isOverdue = t.deadline && isPast(new Date(t.deadline)) && t.status !== 'done'
                            return (
                                <TableRow key={t.id}>
                                    <TableCell>
                                        <p className="font-semibold text-slate-800 max-w-[180px] truncate">{t.judul}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{t.divisi?.nama || t.platform?.nama || 'General'}</p>
                                    </TableCell>
                                    <TableCell>
                                        {t.assigned_user ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">
                                                    {t.assigned_user.full_name?.charAt(0)}
                                                </div>
                                                <span className="text-sm text-slate-700">{t.assigned_user.full_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Belum diambil</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">
                                        {t.deadline ? format(new Date(t.deadline), 'dd MMM yyyy', { locale: id }) : '-'}
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
                                    <TableCell>
                                        {t.evidence_url ? (
                                            <a href={t.evidence_url} target="_blank" rel="noreferrer"
                                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                                <ExternalLink size={12} /> Lihat
                                            </a>
                                        ) : <span className="text-xs text-slate-400">—</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {t.status === 'review' && (
                                                <>
                                                    <Button size="sm" className="h-7 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                                                        onClick={() => handleApprove(t.id)}>Approve</Button>
                                                    <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg"
                                                        onClick={() => handleRevisi(t.id)}>Revisi</Button>
                                                </>
                                            )}
                                            <button onClick={() => handleDelete(t.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

// ─── KANBAN VIEW (untuk User biasa) ──────────────────────────────────────────
function KanbanView() {
    const { user } = useAuthStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'all' | 'mine'>('all')
    const { data, isLoading, fetchData } = useApi('/tasks', { immediate: false })
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [evidenceUrl, setEvidenceUrl] = useState('')

    useEffect(() => { if (user) fetchData() }, [user, fetchData])

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 3000)
    }

    const filteredTasks = (data?.data || []).filter((t: any) => {
        const matchSearch = t.judul.toLowerCase().includes(searchQuery.toLowerCase())
        const matchMine = viewMode === 'all' || t.assigned_to === user?.id
        return matchSearch && matchMine
    })

    const handleStatusUpdate = async (taskId: string, newStatus: string) => {
        try {
            await apiFetch(`/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
            showNotification(`Status diperbarui`)
            fetchData()
            setIsDetailModalOpen(false)
        } catch (err: any) { showNotification(err.message || 'Gagal', 'error') }
    }

    const handleSubmitEvidence = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedTask) return
        setIsSubmitting(true)
        try {
            await apiFetch(`/tasks/${selectedTask.id}/evidence`, { method: 'PUT', body: JSON.stringify({ evidence_url: evidenceUrl }) })
            showNotification('Bukti kerja berhasil dikirim')
            setIsEvidenceModalOpen(false)
            setEvidenceUrl('')
            fetchData()
        } catch (err: any) { showNotification(err.message || 'Gagal', 'error') }
        finally { setIsSubmitting(false) }
    }

    const getPriorityColor = (p: string) => ({
        urgent: 'text-rose-600 bg-rose-50 border-rose-200',
        high: 'text-orange-600 bg-orange-50 border-orange-200',
        low: 'text-slate-600 bg-slate-50 border-slate-200',
    }[p] || 'text-blue-600 bg-blue-50 border-blue-200')

    const TaskCard = ({ task }: { task: any }) => {
        const isAssignedToMe = task.assigned_to === user?.id
        const hoursLeft = task.deadline ? differenceInHours(new Date(task.deadline), new Date()) : 999
        const isUrgent = hoursLeft >= 0 && hoursLeft < 24
        const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== 'done'
        return (
            <div onClick={() => { setSelectedTask(task); setIsDetailModalOpen(true) }}
                className={`group bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col min-h-[140px] ${isUrgent ? 'border-rose-300 bg-rose-50/30' : isOverdue ? 'border-slate-300 bg-slate-100 opacity-80' : 'border-slate-200 hover:border-blue-300'}`}>
                {isUrgent && <div className="absolute top-0 right-0 px-2 py-0.5 bg-rose-600 text-[8px] font-black text-white rounded-bl-lg animate-pulse uppercase">DUE SOON</div>}
                {isOverdue && <div className="absolute top-0 right-0 px-2 py-0.5 bg-slate-800 text-[8px] font-black text-white rounded-bl-lg uppercase">OVERDUE</div>}
                <div className={`absolute top-0 left-0 w-1 h-full ${task.status === 'todo' ? 'bg-slate-300' : task.status === 'in_progress' ? 'bg-blue-400' : task.status === 'review' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                <div className="flex justify-between items-start mb-3">
                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                        {task.divisi?.nama || task.platform?.nama || 'General'}
                    </Badge>
                    <span className={`px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                    </span>
                </div>
                <h4 className="font-bold text-slate-800 leading-tight mb-2 line-clamp-2">{task.judul}</h4>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <div className="flex items-center text-[10px] text-slate-500 gap-1">
                        <Clock size={12} />
                        {task.deadline ? format(new Date(task.deadline), 'dd MMM', { locale: id }) : '-'}
                    </div>
                    {task.status === 'todo' && (
                        <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleStatusUpdate(task.id, 'in_progress') }}
                            className="h-7 px-2 text-[10px] gap-1 rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50">
                            <PlayCircle size={12} /> Ambil
                        </Button>
                    )}
                    {task.status === 'in_progress' && isAssignedToMe && (
                        <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setSelectedTask(task); setIsEvidenceModalOpen(true) }}
                            className="h-7 px-2 text-[10px] gap-1 rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50">
                            <CheckCircle2 size={12} /> Selesai
                        </Button>
                    )}
                    {task.status === 'review' && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase">
                            <Clock size={11} /> Review
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const cols = [
        { key: 'todo', label: 'Antrean', color: 'text-slate-400', dot: 'bg-slate-300', bg: 'bg-slate-50/50 border-slate-200/50' },
        { key: 'in_progress', label: 'Dikerjakan', color: 'text-blue-600', dot: 'bg-blue-500 animate-pulse', bg: 'bg-blue-50/20 border-blue-100' },
        { key: 'review', label: 'Review', color: 'text-amber-600', dot: 'bg-amber-500', bg: 'bg-amber-50/20 border-amber-100' },
        { key: 'done', label: 'Selesai', color: 'text-blue-600', dot: 'bg-blue-500', bg: 'bg-blue-50/20 border-blue-100' },
    ]

    return (
        <div className="space-y-6 min-h-screen">
            {notification && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border animate-in slide-in-from-top-4 duration-300 ${notification.type === 'success' ? 'bg-blue-50/95 border-blue-200 text-blue-800' : 'bg-rose-50/95 border-rose-200 text-rose-800'}`}>
                    {notification.type === 'success' ? <CheckCircle2 size={20} className="text-blue-500" /> : <AlertCircle size={20} className="text-rose-500" />}
                    <p className="text-sm font-bold">{notification.message}</p>
                </div>
            )}

            {/* Header */}
            <div className="relative overflow-hidden rounded-[32px] bg-slate-900 p-8 text-white shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tight">Task Board</h1>
                        <p className="text-slate-400">Ambil tugas dan kumpulkan poin performa!</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl">
                        <div className="px-4 py-2 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                            <p className="text-xl font-black text-white">{filteredTasks.length}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="px-4 py-2 text-center">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Selesai</p>
                            <p className="text-xl font-black text-white">{filteredTasks.filter((t: any) => t.status === 'done').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                    {(['all', 'mine'] as const).map(m => (
                        <button key={m} onClick={() => setViewMode(m)}
                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${viewMode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                            {m === 'all' ? 'Semua' : 'Tugas Saya'}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Cari tugas..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>

            {/* Kanban */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
                {cols.map(col => (
                    <div key={col.key} className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <div className={`flex items-center gap-2 font-extrabold text-xs uppercase tracking-widest ${col.color}`}>
                                <span className={`w-2 h-2 rounded-full ${col.dot}`} /> {col.label}
                            </div>
                            <Badge className="rounded-full text-xs">{filteredTasks.filter((t: any) => t.status === col.key).length}</Badge>
                        </div>
                        <div className={`space-y-4 min-h-[500px] p-2 rounded-3xl border-2 border-dashed ${col.bg}`}>
                            {filteredTasks.filter((t: any) => t.status === col.key).map((task: any) => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal: Evidence */}
            <Modal isOpen={isEvidenceModalOpen} onClose={() => setIsEvidenceModalOpen(false)} title="Kirim Bukti Pekerjaan" size="md">
                <form onSubmit={handleSubmitEvidence} className="space-y-4">
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-800 text-sm flex gap-3">
                        <AlertCircle size={18} className="shrink-0" />
                        Lampirkan link bukti hasil pekerjaan (Google Drive, YouTube, Figma).
                    </div>
                    <Input label="Link Bukti Kerja" placeholder="https://..." value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} required />
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" type="button" onClick={() => setIsEvidenceModalOpen(false)}>Batal</Button>
                        <Button type="submit" isLoading={isSubmitting}>Kirim Review</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Detail */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Tugas" size="lg">
                {selectedTask && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-900">{selectedTask.judul}</h3>
                            <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{selectedTask.divisi?.nama || selectedTask.platform?.nama || 'General'}</Badge>
                                <Badge className={`text-[10px] ${STATUS_STYLE[selectedTask.status]}`}>{selectedTask.status.replace('_', ' ')}</Badge>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700">
                            {selectedTask.deskripsi || <span className="italic text-slate-400">Tidak ada deskripsi.</span>}
                        </div>
                        {selectedTask.evidence_url && (
                            <a href={selectedTask.evidence_url} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold hover:bg-blue-100 transition-all">
                                <ExternalLink size={16} /> Lihat Bukti Pekerjaan
                            </a>
                        )}
                        <div className="flex flex-col gap-2">
                            {selectedTask.status === 'review' && (
                                <>
                                    <Button className="w-full bg-blue-600 text-white" onClick={() => handleStatusUpdate(selectedTask.id, 'done')}>Approve</Button>
                                    <Button variant="outline" className="w-full border-rose-200 text-rose-600" onClick={() => handleStatusUpdate(selectedTask.id, 'in_progress')}>Minta Revisi</Button>
                                </>
                            )}
                            {selectedTask.status === 'done' && (
                                <p className="text-xs text-blue-600 font-bold bg-blue-50 p-3 rounded-xl text-center">Tugas Selesai ✓</p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TasksPage() {
    const { user, hasAnyPermission } = useAuthStore()
    const isKetua = hasAnyPermission('ketua_divisi', 'ketua_platform') || user?.baseRole === 'admin'

    if (!user) return null
    return isKetua ? <HistoriView /> : <KanbanView />
}
