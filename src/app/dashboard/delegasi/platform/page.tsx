'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Plus, Users, Layout, CheckCircle2, AlertCircle, Clock, Trash2, Globe, Monitor, Send } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function DelegasiPlatformPage() {
    const { user, hasPermission } = useAuthStore()

    // Scoped Data: Only for members and tasks of platforms managed by this user
    // The backend logic for /users?divisi_only=true now handles this scoping for pimpinan
    const { data: teamData, isLoading: isTeamLoading, fetchData: refreshTeam } = useApi('/users?role=user&divisi_only=true', { immediate: true })
    const { data: tasksData, isLoading: isTasksLoading, fetchData: refreshTasks } = useApi('/tasks', { immediate: true })
    const { data: platformsData } = useApi('/platform', { immediate: true })

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

    const [formData, setFormData] = useState({
        judul: '',
        deskripsi: '',
        priority: 'medium',
        platform_id: '',
        assigned_to: '',
        deadline: '',
    })

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 3000)
    }

    const members = teamData?.data || []
    const tasks = tasksData?.items || []
    const platforms = platformsData || []

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await apiFetch('/tasks', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
                })
            })
            showNotification('Tugas didelegasikan')
            setIsCreateModalOpen(false)
            setFormData({ judul: '', deskripsi: '', priority: 'medium', platform_id: '', assigned_to: '', deadline: '' })
            refreshTasks()
        } catch (err: any) {
            showNotification(err.message || 'Gagal membuat tugas', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top-full duration-300 ${notification.type === 'success'
                    ? 'bg-blue-50 border-blue-100 text-blue-800'
                    : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle2 className="text-blue-500" size={24} /> : <AlertCircle className="text-rose-500" size={24} />}
                    <div className="flex flex-col">
                        <p className="text-sm font-black leading-none">{notification.type === 'success' ? 'Berhasil!' : 'Gagal'}</p>
                        <p className="text-xs font-medium mt-1.5 opacity-80">{notification.message}</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Delegasi Platform</h1>
                    <p className="text-slate-500 mt-1">Manajemen konten dan distribusi tugas untuk channel publikasi.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Monitor size={18} />
                        Audit Konten
                    </Button>
                    <Button className="flex items-center gap-2" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={18} />
                        Delegasi Tugas
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Team Members List */}
                <Card className="md:col-span-2 border-slate-200/60 shadow-none overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-blue-600">
                            <Users size={20} />
                            Tim Platform
                        </CardTitle>
                        <CardDescription>Staf yang tersedia di lingkup divisi Anda untuk ditugaskan.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/30 hover:bg-slate-50/30">
                                    <TableHead>Nama Anggota</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Kapasitas</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isTeamLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400">Memuat anggota...</TableCell></TableRow>
                                ) : members.length > 0 ? members.map((member: any) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-bold text-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">
                                                    {member.full_name?.charAt(0)}
                                                </div>
                                                {member.full_name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500 font-medium">{member.email}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: '20%' }}></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">Tersedia</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-50" onClick={() => {
                                                setFormData({ ...formData, assigned_to: member.id });
                                                setIsCreateModalOpen(true);
                                            }}>Tugaskan</Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400">Belum ada anggota tim ditemukan.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Right Column: Info & Stats */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Globe size={18} className="text-blue-200" />
                                Channel Dikelola
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {platforms.length > 0 ? platforms.map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                                        <span className="text-sm font-bold">{p.nama}</span>
                                        <div className="flex gap-1">
                                            <Badge variant="success" className="bg-blue-500/20 text-white border-none text-[8px]">Aktif</Badge>
                                        </div>
                                    </div>
                                )) : <p className="text-xs text-blue-100 italic opacity-60">Tidak ada channel</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/60 shadow-none">
                        <CardHeader className="pb-3 border-b border-slate-50">
                            <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Aktivitas Terkini</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 px-0">
                            <div className="space-y-1">
                                {isTasksLoading ? (
                                    <div className="text-center p-4 text-xs text-slate-400">Memuat...</div>
                                ) : tasks.slice(0, 5).map((t: any) => (
                                    <div key={t.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 transition-colors px-6 border-b border-slate-50 last:border-0">
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${t.status === 'done' ? 'bg-blue-400' : 'bg-amber-400 animate-pulse'}`}></div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate leading-tight">{t.judul}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{t.assigned_to_name || 'Belum Ditugaskan'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Create Task Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Delegasikan Tugas Platform"
                description="Kirimkan perintah kerja ke anggota tim platform Anda."
            >
                <form onSubmit={handleCreateTask} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Pekerjaan</label>
                        <Input
                            placeholder="Judul postingan atau task teknis..."
                            value={formData.judul}
                            onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Platform</label>
                            <Select
                                value={formData.platform_id}
                                onChange={(e) => setFormData({ ...formData, platform_id: e.target.value })}
                                options={platforms.map((p: any) => ({ value: p.id, label: p.nama }))}
                                placeholder="Pilih Channel"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Prioritas</label>
                            <Select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                options={[
                                    { value: 'low', label: 'Low' },
                                    { value: 'medium', label: 'Medium' },
                                    { value: 'high', label: 'High' },
                                    { value: 'urgent', label: 'Urgent' },
                                ]}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Assign Ke</label>
                            <Select
                                value={formData.assigned_to}
                                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                options={members.map((m: any) => ({ value: m.id, label: m.full_name }))}
                                placeholder="Pilih Staf"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Deadline</label>
                            <Input
                                type="date"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Deskripsi/Brief</label>
                        <textarea
                            className="w-full h-24 p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Berikan detail arahan..."
                            value={formData.deskripsi}
                            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                            {isSubmitting ? 'Mengirim...' : 'Kirim Tugas'}
                            {!isSubmitting && <Send size={16} />}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}