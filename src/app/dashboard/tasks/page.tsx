// src/app/dashboard/tasks/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { CheckCircle2, Clock, PlayCircle, AlertCircle, Plus, XCircle, FileText, ExternalLink, ShieldCheck, Search, Edit2, Trash2 } from 'lucide-react'
import { format, differenceInHours, isPast } from 'date-fns'
import { id } from 'date-fns/locale'

export default function TasksPage() {
    const { user, hasAnyPermission } = useAuthStore()

    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterDivisi, setFilterDivisi] = useState('')
    const [filterPlatform, setFilterPlatform] = useState('')
    const [viewMode, setViewMode] = useState<'all' | 'mine'>('all')

    const fetchUrl = '/tasks'
    const { data, isLoading, error, fetchData } = useApi(fetchUrl, { immediate: false })

    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 3000)
    }

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user, fetchData])

    const canManageTask = hasAnyPermission('ketua_divisi', 'ketua_platform') || user?.baseRole === 'admin'

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingTask, setEditingTask] = useState<any>(null)

    // AUTO-LOCK DIVISION FOR STUDENTS
    useEffect(() => {
        if (user && user.baseRole === 'user' && !hasAnyPermission('ketua_divisi', 'ketua_platform')) {
            if (user.divisiId) {
                setFilterDivisi(user.divisiId)
            }
        }
    }, [user, hasAnyPermission])

    // Form States
    const [formData, setFormData] = useState({
        judul: '',
        deskripsi: '',
        priority: 'medium',
        poin: 10,
        divisi_id: '',
        platform_id: '',
        deadline: '',
        assigned_to: '',
    })
    const [evidenceUrl, setEvidenceUrl] = useState('')
    
    // Auto-populate for Chairmen
    useEffect(() => {
        if (isCreateModalOpen && user) {
            if (user.dynamicPermissions.includes('ketua_divisi') && user.divisiId) {
                setFormData(prev => ({ ...prev, divisi_id: user.divisiId || '' }))
            }
            // Add similar logic for ketua_platform if platform_id is available in user object
        }
    }, [isCreateModalOpen, user])

    const { data: platformsData } = useApi('/platform', { immediate: true })
    const { data: divisionsData } = useApi('/divisi', { immediate: true })
    const { data: membersData } = useApi('/users?limit=100', { immediate: true })

    const platforms = Array.isArray(platformsData) ? platformsData : (platformsData?.data || [])
    const divisions = Array.isArray(divisionsData) ? divisionsData : (divisionsData?.data || [])
    const members = Array.isArray(membersData) ? membersData : (membersData?.data || [])

    // FILTER LOGIC
    const filteredTasks = (data?.data || []).filter((t: any) => {
        const matchesSearch = t.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (t.deskripsi && t.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesStatus = filterStatus === 'all' || t.status === filterStatus
        const matchesDivisi = !filterDivisi || t.divisi_id === filterDivisi
        const matchesPlatform = !filterPlatform || t.platform_id === filterPlatform
        const matchesMine = viewMode === 'all' || t.assigned_to === user?.id

        return matchesSearch && matchesStatus && matchesDivisi && matchesPlatform && matchesMine
    })

    const handleStatusUpdate = async (taskId: string, newStatus: string) => {
        try {
            await apiFetch(`/tasks/${taskId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            })
            showNotification(`Tugas dipindahkan ke ${newStatus.replace('_', ' ')}`)
            fetchData()
            setIsDetailModalOpen(false)
        } catch (err: any) {
            showNotification(err.message || 'Gagal memperbarui status', 'error')
        }
    }

    const handleSubmitEvidence = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedTask) return
        setIsSubmitting(true)
        try {
            await apiFetch(`/tasks/${selectedTask.id}/evidence`, {
                method: 'PUT',
                body: JSON.stringify({ evidence_url: evidenceUrl })
            })
            showNotification('Bukti kerja berhasil dikirim. Menunggu review.')
            setIsEvidenceModalOpen(false)
            setEvidenceUrl('')
            fetchData()
        } catch (err: any) {
            showNotification(err.message || 'Gagal mengirim bukti', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const body = {
                ...formData,
                divisi_id: formData.divisi_id || null,
                platform_id: formData.platform_id || null,
                assigned_to: formData.assigned_to || null,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
            }

            if (editingTask) {
                await apiFetch(`/tasks/${editingTask.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(body)
                })
                showNotification('Tugas berhasil diperbarui')
            } else {
                await apiFetch('/tasks', {
                    method: 'POST',
                    body: JSON.stringify(body)
                })
                showNotification('Tugas berhasil didelegasikan')
            }

            setIsCreateModalOpen(false)
            setEditingTask(null)
            setFormData({ judul: '', deskripsi: '', priority: 'medium', poin: 10, divisi_id: '', platform_id: '', deadline: '', assigned_to: '' })
            fetchData()
        } catch (err: any) {
            showNotification(err.message || 'Gagal menyimpan tugas', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteTask = async (id: string) => {
        if (!confirm('Hapus tugas ini secara permanen?')) return
        try {
            await apiFetch(`/tasks/${id}`, { method: 'DELETE' })
            showNotification('Tugas telah dihapus')
            fetchData()
            setIsDetailModalOpen(false)
        } catch (err: any) {
            showNotification(err.message || 'Gagal menghapus tugas', 'error')
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-rose-600 bg-rose-50 border-rose-200'
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
            case 'low': return 'text-slate-600 bg-slate-50 border-slate-200'
            default: return 'text-blue-600 bg-blue-50 border-blue-200'
        }
    }

    const TaskCard = ({ task }: { task: any }) => {
        const isAssignedToMe = task.assigned_to === user?.id;
        const isUnassigned = !task.assigned_to;
        
        // Deadline Warning (> 0 and < 24 hours)
        const hoursLeft = task.deadline ? differenceInHours(new Date(task.deadline), new Date()) : 999;
        const isUrgent = hoursLeft >= 0 && hoursLeft < 24;
        const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== 'done';

        return (
            <div
                onClick={() => { setSelectedTask(task); setIsDetailModalOpen(true); }}
                className={`group bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col min-h-[140px] ${
                    isUrgent ? 'border-rose-300 bg-rose-50/30' : 
                    isOverdue ? 'border-slate-300 bg-slate-100 opacity-80' : 'border-slate-200 hover:border-blue-300'
                }`}
            >
                {isUrgent && <div className="absolute top-0 right-0 px-2 py-0.5 bg-rose-600 text-[8px] font-black text-white rounded-bl-lg animate-pulse uppercase">DUE SOON</div>}
                {isOverdue && <div className="absolute top-0 right-0 px-2 py-0.5 bg-slate-800 text-[8px] font-black text-white rounded-bl-lg uppercase">OVERDUE</div>}

                <div className={`absolute top-0 left-0 w-1 h-full ${
                        task.status === 'todo' ? 'bg-slate-300' :
                        task.status === 'in_progress' ? (isUrgent ? 'bg-rose-500' : 'bg-blue-400') :
                        task.status === 'review' ? 'bg-amber-400' : 'bg-blue-400'
                    }`}></div>

                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-[10px] w-fit bg-slate-50 text-slate-600 border-slate-200">
                            {task.divisi?.nama || task.platform?.nama || 'General'}
                        </Badge>
                        {task.assigned_user && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                                    {task.assigned_user.full_name.charAt(0)}
                                </div>
                                {isAssignedToMe ? 'Milik Saya' : task.assigned_user.full_name}
                            </div>
                        )}
                        {isUnassigned && task.status === 'todo' && (
                            <span className="text-[9px] font-bold text-rose-500 animate-pulse">Belum Diambil</span>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                            {canManageTask && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingTask(task)
                                        setFormData({
                                            judul: task.judul,
                                            deskripsi: task.deskripsi || '',
                                            priority: task.priority || 'medium',
                                            poin: task.poin || 10,
                                            divisi_id: task.divisi_id || '',
                                            platform_id: task.platform_id || '',
                                            deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
                                            assigned_to: task.assigned_to || ''
                                        })
                                        setIsCreateModalOpen(true)
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Edit2 size={12} />
                                </button>
                            )}
                            {canManageTask && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                                â­  {task.poin || 0}
                            </span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${getPriorityColor(task.priority)}`}>
                            {task.priority || 'medium'}
                        </span>
                    </div>
                </div>

                <h4 className="font-bold text-slate-800 leading-tight mb-2 line-clamp-2">{task.judul}</h4>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <div className="flex items-center text-[10px] text-slate-500 gap-1 font-medium">
                        <Clock size={12} className="text-slate-400" />
                        <span>{task.deadline ? format(new Date(task.deadline), 'dd MMM', { locale: id }) : '-'}</span>
                    </div>

                    {task.status === 'todo' && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(task.id, 'in_progress'); }}
                            className="h-7 px-2 text-[10px] gap-1 rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                            <PlayCircle size={12} /> Ambil
                        </Button>
                    )}

                    {task.status === 'in_progress' && isAssignedToMe && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setIsEvidenceModalOpen(true); }}
                            className="h-7 px-2 text-[10px] gap-1 rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                            <CheckCircle2 size={12} /> Selesai
                        </Button>
                    )}

                    {task.status === 'review' && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase tracking-tighter">
                            <Clock size={11} /> Menunggu Review
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-4 duration-300 ${notification.type === 'success' ? 'bg-blue-50/95 border-blue-200 text-blue-800' : 'bg-rose-50/95 border-rose-200 text-rose-800'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle2 size={20} className="text-blue-500" /> : <AlertCircle size={20} className="text-rose-500" />}
                    <p className="text-sm font-bold">{notification.message}</p>
                </div>
            )}

            {/* Role-Based Hero Header */}
            <div className="relative overflow-hidden rounded-[32px] bg-slate-900 p-8 lg:p-12 text-white shadow-2xl shadow-slate-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] -ml-32 -mb-32"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-widest text-blue-400">
                            <ShieldCheck size={14} /> {user?.baseRole === 'admin' ? 'Administrative Control' : 'Division Workspace'}
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                            {user?.baseRole === 'admin' || canManageTask
                                ? 'Pantau & Kelola Tugas Multimedia'
                                : `Assalamu'alaikum, ${user?.fullName?.split(' ')[0] || 'Santri'}!`}
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
                            {user?.baseRole === 'admin' || canManageTask
                                ? 'Awasi progress pengerjaan tugas dan berikan approval untuk hasil terbaik.'
                                : 'Siap memberikan kontribusi terbaik hari ini? Pilih tugasmu dan kumpulkan poin performa!'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {canManageTask && (
                            <Button
                                className="h-14 px-8 bg-blue-500 hover:bg-blue-400 text-slate-900 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center gap-3 font-black text-base transition-all hover:scale-105 active:scale-95"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                <Plus size={24} /> Delegasi Baru
                            </Button>
                        )}
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-sm">
                            <div className="px-4 py-2 text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Task</p>
                                <p className="text-xl font-black text-white">{filteredTasks.length}</p>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="px-4 py-2 text-center">
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Selesai</p>
                                <p className="text-xl font-black text-white">{filteredTasks.filter((t: any) => t.status === 'done').length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Missing Division Warning */}
            {user?.baseRole === 'user' && !user?.divisiId && !hasAnyPermission('ketua_divisi', 'ketua_platform') && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-[28px] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
                    <div className="flex items-center gap-4 text-rose-500">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-lg">Profil Belum Lengkap!</h3>
                            <p className="text-sm font-medium opacity-80">Anda belum memilih **Divisi** di profil. Tugas tidak dapat ditampilkan sampai Anda bergabung ke sebuah divisi.</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => window.location.href = '/dashboard/profile'}
                        className="bg-rose-500 hover:bg-rose-600 text-white px-8 h-12 rounded-xl font-bold gap-2 shrink-0 shadow-lg shadow-rose-500/10"
                    >
                        Pilih Divisi Sekarang
                    </Button>
                </div>
            )}

            {/* Header with Search & Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50">
                <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
                    {/* View Mode Toggle */}
                    <div className="flex p-1 bg-slate-100 rounded-xl w-fit shrink-0">
                        <button 
                            onClick={() => setViewMode('all')}
                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${viewMode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Semua
                        </button>
                        <button 
                            onClick={() => setViewMode('mine')}
                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${viewMode === 'mine' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tugas Saya
                        </button>
                    </div>

                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari liputan, desain, atau naskah..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-11 w-full rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-sm"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select 
                        value={filterDivisi} 
                        onChange={(e) => setFilterDivisi(e.target.value)}
                        disabled={user?.baseRole === 'user' && !hasAnyPermission('ketua_divisi', 'ketua_platform')}
                        className={`h-11 px-4 rounded-xl border-none bg-slate-100 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 ${user?.baseRole === 'user' && !hasAnyPermission('ketua_divisi', 'ketua_platform') ? 'opacity-80 grayscale cursor-not-allowed' : ''}`}
                    >
                        <option value="">{user?.baseRole === 'admin' ? 'Semua Divisi' : 'Pilih Divisi'}</option>
                        {divisions.map((d: any) => <option key={d.id} value={d.id}>{d.nama} {d.id === user?.divisiId ? '(Divisi Saya)' : ''}</option>)}
                    </select>

                    <select 
                        value={filterPlatform} 
                        onChange={(e) => setFilterPlatform(e.target.value)}
                        className="h-11 px-4 rounded-xl border-none bg-slate-100 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">Semua Platform</option>
                        {platforms.map((p: any) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                    </select>

                    <Button variant="outline" onClick={() => { setSearchQuery(''); setFilterDivisi(''); setFilterPlatform(''); setViewMode('all'); }} className="h-11 px-4 rounded-xl text-xs font-bold border-slate-200">
                        Reset
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
                {/* Column: TODO */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2 font-extrabold text-slate-400 text-xs uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-slate-300"></span> Antrean
                        </div>
                        <Badge className="bg-slate-100 text-slate-500 rounded-full">{filteredTasks.filter((t: any) => t.status === 'todo').length}</Badge>
                    </div>
                    <div className="space-y-4 min-h-[500px] p-2 rounded-3xl bg-slate-50/50 border-2 border-dashed border-slate-200/50">
                        {filteredTasks.filter((t: any) => t.status === 'todo').map((task: any) => <TaskCard key={task.id} task={task} />)}
                    </div>
                </div>

                {/* Column: IN PROGRESS */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2 font-extrabold text-blue-600 text-xs uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Dikerjakan
                        </div>
                        <Badge className="bg-blue-100 text-blue-600 rounded-full">{filteredTasks.filter((t: any) => t.status === 'in_progress').length}</Badge>
                    </div>
                    <div className="space-y-4 min-h-[500px] p-2 rounded-3xl bg-blue-50/20 border-2 border-dashed border-blue-100">
                        {filteredTasks.filter((t: any) => t.status === 'in_progress').map((task: any) => <TaskCard key={task.id} task={task} />)}
                    </div>
                </div>

                {/* Column: REVIEW */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2 font-extrabold text-amber-600 text-xs uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Tahap Review
                        </div>
                        <Badge className="bg-amber-100 text-amber-600 rounded-full">{filteredTasks.filter((t: any) => t.status === 'review').length}</Badge>
                    </div>
                    <div className="space-y-4 min-h-[500px] p-2 rounded-3xl bg-amber-50/20 border-2 border-dashed border-amber-100">
                        {filteredTasks.filter((t: any) => t.status === 'review').map((task: any) => <TaskCard key={task.id} task={task} />)}
                    </div>
                </div>

                {/* Column: DONE */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2 font-extrabold text-blue-600 text-xs uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-400"></span> Selesai
                        </div>
                        <Badge className="bg-blue-100 text-blue-600 rounded-full">{filteredTasks.filter((t: any) => t.status === 'done').length}</Badge>
                    </div>
                    <div className="space-y-4 min-h-[500px] p-2 rounded-3xl bg-blue-50/20 border-2 border-dashed border-blue-100">
                        {filteredTasks.filter((t: any) => t.status === 'done').map((task: any) => <TaskCard key={task.id} task={task} />)}
                    </div>
                </div>
            </div>

            {/* MODAL: Submit Evidence */}
            <Modal isOpen={isEvidenceModalOpen} onClose={() => setIsEvidenceModalOpen(false)} title="Kirim Bukti Pekerjaan" size="md">
                <form onSubmit={handleSubmitEvidence} className="space-y-6">
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-800 text-sm flex gap-3">
                        <AlertCircle size={20} className="shrink-0" />
                        <p>Lampirkan link bukti hasil pekerjaan (Google Drive, YouTube, atau Link Figma) untuk di-review oleh atasan.</p>
                    </div>
                    <Input
                        label="Link Bukti Kerja (URL)"
                        placeholder="https://..."
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        required
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsEvidenceModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" isLoading={isSubmitting}>
                            Kirim Review
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* MODAL: Detail Task */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Tugas" size="lg">
                {selectedTask && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedTask.judul}</h3>
                                <div className="flex flex-wrap gap-2 items-center text-sm font-medium text-slate-500">
                                    <Badge variant="outline" className="bg-slate-50">{selectedTask.divisi?.nama || selectedTask.platform?.nama || 'General'}</Badge>
                                    <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 text-[11px]">â­ {selectedTask.poin || 0} Points</span>
                                    <span className="text-slate-300">/</span>
                                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(selectedTask.priority)}`}>
                                        {selectedTask.priority}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status Saat Ini</p>
                                <Badge className={`uppercase text-[10px] py-1 px-3 ${selectedTask.status === 'todo' ? 'bg-slate-100 text-slate-600' :
                                    selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        selectedTask.status === 'review' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {selectedTask.status.replace('_', ' ')}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14} /> Deskripsi Tugas
                                    </label>
                                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedTask.deskripsi || <span className="italic text-slate-400">Tidak ada deskripsi tambahan.</span>}
                                    </p>
                                </div>

                                {selectedTask.evidence_url && (
                                    <div className="space-y-3 p-5 rounded-2xl bg-blue-50 border border-blue-100">
                                        <label className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck size={14} /> Bukti Pekerjaan
                                        </label>
                                        <a
                                            href={selectedTask.evidence_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between p-4 rounded-xl bg-white border border-blue-200 text-blue-700 hover:text-blue-800 hover:border-blue-400 transition-all group font-bold text-sm shadow-sm"
                                        >
                                            <span className="truncate mr-4">{selectedTask.evidence_url}</span>
                                            <ExternalLink size={18} className="shrink-0 group-hover:scale-110 transition-transform" />
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi Waktu</label>
                                    <div className="space-y-3 text-sm font-medium">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Deadline</span>
                                            <span className="text-rose-600 flex items-center gap-1.5"><Clock size={14} />{selectedTask.deadline ? format(new Date(selectedTask.deadline), 'dd MMM yyyy', { locale: id }) : '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Dibuat</span>
                                            <span className="text-slate-700">{format(new Date(selectedTask.created_at), 'dd MMM yyyy', { locale: id })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi Manajemen</label>
                                    <div className="flex flex-col gap-2">
                                        {selectedTask.status === 'review' && canManageTask && (
                                            <Button
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200"
                                                onClick={() => handleStatusUpdate(selectedTask.id, 'done')}
                                            >
                                                Approve (Selesai)
                                            </Button>
                                        )}
                                        {selectedTask.status === 'review' && canManageTask && (
                                            <Button
                                                variant="outline"
                                                className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
                                                onClick={() => handleStatusUpdate(selectedTask.id, 'in_progress')}
                                            >
                                                Minta Revisi
                                            </Button>
                                        )}
                                        {selectedTask.status !== 'done' && !canManageTask && (
                                            <p className="text-xs text-slate-400 italic text-center">Menunggu tindakan selanjutnya...</p>
                                        )}
                                        {selectedTask.status === 'done' && (
                                            <p className="text-xs text-blue-600 font-bold bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">Tugas Telah Selesai âœ“</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL: Create Task */}
            <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingTask(null); }} title={editingTask ? 'Perbarui Tugas' : 'Delegasikan Tugas Baru'} size="lg">
                <form onSubmit={handleSaveTask} className="space-y-6">
                    <Input label="Judul Tugas" placeholder="Judul ringkas..." value={formData.judul} onChange={(e) => setFormData({ ...formData, judul: e.target.value })} required />
                    <div className="grid grid-cols-3 gap-4">
                        <Select label="Prioritas" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
                        <Input label="Poin Reward" type="number" value={formData.poin} onChange={(e) => setFormData({ ...formData, poin: parseInt(e.target.value) })} />
                        <Input label="Deadline" type="datetime-local" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Divisi" value={formData.divisi_id} onChange={(e) => setFormData({ ...formData, divisi_id: e.target.value, platform_id: '', assigned_to: '' })} options={[{ value: '', label: '-- Pilih Divisi --' }, ...divisions.map((d: any) => ({ value: d.id, label: d.nama }))]} />
                        <Select label="Platform" value={formData.platform_id} onChange={(e) => setFormData({ ...formData, platform_id: e.target.value, divisi_id: '', assigned_to: '' })} options={[{ value: '', label: '-- Pilih Platform --' }, ...platforms.map((p: any) => ({ value: p.id, label: p.nama }))]} />
                    </div>
                    
                    <Select 
                        label="Delegasikan Berikan Tugas Ke" 
                        value={formData.assigned_to} 
                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} 
                        options={[
                            { value: '', label: '-- Biarkan Kosong (Ambil Sendiri) --' }, 
                            ...members
                                .filter((m: any) => 
                                    (formData.divisi_id && m.divisi_id === formData.divisi_id) || 
                                    (formData.platform_id && m.user_permissions?.some((p: any) => p.platform_id === formData.platform_id)) ||
                                    (!formData.divisi_id && !formData.platform_id)
                                )
                                .map((m: any) => ({ value: m.id, label: `${m.full_name} (${m.divisi?.nama || 'Tanpa Divisi'})` }))
                        ]} 
                    />

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700">Deskripsi</label>
                        <textarea className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none shadow-inner" placeholder="Instruksi lengkap..." value={formData.deskripsi} onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4"><Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Batal</Button><Button type="submit" className="bg-blue-600 text-white font-bold px-8 rounded-xl" isLoading={isSubmitting}>Kirim Tugas</Button></div>
                </form>
            </Modal>
        </div>
    )
}