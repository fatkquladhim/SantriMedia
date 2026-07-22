'use client'

import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable } from '@/components/ui/DataTable'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Building2, Plus, Trash2, Edit2, Bed, AlertCircle, Home, RefreshCw } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

export default function AdminMasterAsramaPage() {
    const { data: asrama, isLoading, error, fetchData } = useApi('/asrama', { immediate: true })
    const { data: usersData } = useApi('/users', { immediate: true })

    const users = Array.isArray(usersData) ? usersData : (usersData?.data || [])
    const asramaList = Array.isArray(asrama) ? asrama : (asrama?.data || [])

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingAsrama, setEditingAsrama] = useState<any>(null)
    const [formData, setFormData] = useState({
        nama: '',
        kepala_asrama_id: ''
    })
    const [mutationError, setMutationError] = useState<string | null>(null)

    // Rooms Management States
    const [isKamarModalOpen, setIsKamarModalOpen] = useState(false)
    const [isKamarLoading, setIsKamarLoading] = useState(false)
    const [selectedAsrama, setSelectedAsrama] = useState<any>(null)
    const [roomFormData, setRoomFormData] = useState({ nomor: '', kapasitas: 10 })
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setMutationError(null)
        try {
            const payload = {
                nama: formData.nama,
                kepala_asrama_id: formData.kepala_asrama_id || null
            }
            if (editingAsrama) {
                await apiFetch(`/asrama/${editingAsrama.id}`, { method: 'PUT', body: JSON.stringify(payload) })
            } else {
                await apiFetch('/asrama', { method: 'POST', body: JSON.stringify(payload) })
            }
            setIsModalOpen(false)
            setFormData({ nama: '', kepala_asrama_id: '' })
            setEditingAsrama(null)
            fetchData()
        } catch (err: any) {
            setMutationError(err?.message || 'Gagal menyimpan asrama.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (a: any) => {
        setEditingAsrama(a)
        setMutationError(null)
        setFormData({ nama: a.nama, kepala_asrama_id: a.kepala_asrama_id || '' })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus asrama ini?')) return
        setMutationError(null)
        try {
            await apiFetch(`/asrama/${id}`, { method: 'DELETE' })
            fetchData()
        } catch (err: any) {
            setMutationError(err?.message || 'Gagal menghapus asrama.')
        }
    }

    // Room Handlers
    const handleManageRooms = async (a: any) => {
        setSelectedAsrama(a)
        setIsKamarModalOpen(true)
        setIsKamarLoading(true)
        setMutationError(null)
        try {
            const res = await apiFetch(`/asrama/${a.id}`)
            setSelectedAsrama(res.data || res)
        } catch (err: any) {
            setMutationError(err?.message || 'Gagal memuat detail asrama.')
        } finally {
            setIsKamarLoading(false)
        }
    }

    const handleRoomSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setMutationError(null)
        try {
            const payload = { nomor: roomFormData.nomor, kapasitas: roomFormData.kapasitas }
            if (editingRoomId) {
                await apiFetch(`/asrama/kamar/${editingRoomId}`, { method: 'PUT', body: JSON.stringify(payload) })
            } else {
                await apiFetch(`/asrama/${selectedAsrama.id}/kamar`, { method: 'POST', body: JSON.stringify(payload) })
            }
            setRoomFormData({ nomor: '', kapasitas: 10 })
            setEditingRoomId(null)
            const res = await apiFetch(`/asrama/${selectedAsrama.id}`)
            setSelectedAsrama(res.data || res)
            fetchData()
        } catch (err: any) {
            setMutationError(err?.message || 'Gagal menyimpan kamar.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const deleteRoom = async (id: string) => {
        if (!confirm('Hapus kamar ini?')) return
        try {
            await apiFetch(`/asrama/kamar/${id}`, { method: 'DELETE' })
            const res = await apiFetch(`/asrama/${selectedAsrama.id}`)
            setSelectedAsrama(res.data || res)
            fetchData()
        } catch (err) {
            console.error(err)
        }
    }

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: 'nama',
            header: 'Nama Gedung',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
                        <Building2 size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 leading-none">{row.getValue('nama')}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">
                            Gedung ID: {row.original.id.substring(0, 8)}
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'kepala_asrama',
            header: 'Kepala Asrama',
            cell: ({ row }) => {
                const kepala = row.original.kepala_asrama
                return (
                    <span className="text-sm font-semibold text-slate-700">
                        {kepala ? kepala.full_name : <span className="text-slate-400 italic">Belum ditugaskan</span>}
                    </span>
                )
            }
        },
        {
            id: 'kapasitas',
            header: 'Kapasitas',
            cell: ({ row }) => {
                const roomCount = (row.original.kamar || []).length
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        <Bed size={14} />
                        {roomCount} Kamar Terdaftar
                    </span>
                )
            }
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Aksi</div>,
            cell: ({ row }) => {
                const a = row.original
                return (
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 font-bold text-[10px] uppercase tracking-wider" onClick={() => handleManageRooms(a)}>
                            Kelola Kamar
                        </Button>
                        <Button variant="outline" size="sm" className="p-2 h-9 w-9 rounded-xl hover:bg-slate-50" onClick={() => handleEdit(a)}>
                            <Edit2 size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="p-2 h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-100"
                            onClick={() => handleDelete(a.id)}
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>
                )
            }
        }
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">Hunian Asrama</h1>
                    <p className="text-slate-500 mt-1">Kelola data gedung asrama dan daftar kamar di dalamnya.</p>
                </div>
                <Button
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-900/10 transition-transform active:scale-95 px-6 h-12"
                    onClick={() => { setEditingAsrama(null); setFormData({ nama: '', kepala_asrama_id: '' }); setIsModalOpen(true); }}
                >
                    <Plus size={18} />
                    Tambah Asrama
                </Button>
            </div>

            {(error || mutationError) && (
                <div className="p-4 rounded-xl bg-rose-50/80 backdrop-blur-sm border border-rose-200 text-rose-700 flex items-center gap-3 shadow-sm">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{mutationError || error}</p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-4">
                <div className="md:col-span-3">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-64 glass-panel rounded-3xl">
                            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="mt-4 text-blue-800 font-medium tracking-wide">Memuat Data...</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={asramaList || []}
                            searchKey="nama"
                            searchPlaceholder="Cari nama gedung..."
                        />
                    )}
                </div>

                <div className="md:col-span-1 space-y-4">
                    <div className="glass-panel p-6 rounded-3xl sticky top-24 border-white">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Home size={20} className="text-blue-600" />
                            Statistik
                        </h3>
                        <div className="space-y-4">
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 border-none relative overflow-hidden group shadow-lg shadow-blue-200">
                                <div className="absolute top-0 right-0 p-4 translate-x-2 -translate-y-2 opacity-10 group-hover:scale-110 transition-transform text-white">
                                    <Building2 size={80} />
                                </div>
                                <p className="text-xs font-bold text-blue-100 uppercase tracking-widest relative z-10">Total Gedung</p>
                                <p className="text-4xl font-black text-white mt-1 relative z-10">{asramaList?.length || 0}</p>
                            </div>
                            <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/50 backdrop-blur-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 translate-x-2 -translate-y-2 opacity-10 group-hover:scale-110 transition-transform text-blue-600">
                                    <Bed size={64} />
                                </div>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest relative z-10">Total Kamar</p>
                                <p className="text-3xl font-black text-blue-900 mt-1 relative z-10">
                                    {asramaList?.reduce((acc: number, curr: any) => acc + (curr.kamar?.length || 0), 0) || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Asrama */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingAsrama ? "Edit Asrama" : "Tambah Asrama Baru"}
                description="Lengkapi detail gedung atau rayon asrama."
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nama Asrama"
                        placeholder="Contoh: Asrama Abu Bakar, Khadijah, dll"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        required
                    />
                    <Select
                        label="Kepala Asrama"
                        options={[
                            { value: '', label: 'Belum ditugaskan' },
                            ...users
                                .filter((u: any) => u.base_role === 'kepala_asrama')
                                .map((u: any) => ({ value: u.id, label: u.full_name }))
                        ]}
                        value={formData.kepala_asrama_id}
                        onChange={(e) => setFormData({ ...formData, kepala_asrama_id: e.target.value })}
                    />
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-xl px-10 h-11 text-white shadow-lg shadow-blue-900/10" isLoading={isSubmitting}>
                            {editingAsrama ? "Simpan Perubahan" : "Simpan Asrama"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Manajemen Kamar */}
            <Modal
                isOpen={isKamarModalOpen}
                onClose={() => setIsKamarModalOpen(false)}
                title={`Kelola Kamar: ${selectedAsrama?.nama}`}
                description="Daftar kamar dan penanggung jawab (Kepala Kamar) masing-masing."
                size="lg"
            >
                {isKamarLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
                        <RefreshCw className="animate-spin text-blue-600" size={32} />
                        <p className="font-medium">Mengambil data kamar...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <form onSubmit={handleRoomSubmit} className="p-5 rounded-2xl glass-panel border border-slate-200 bg-slate-50 space-y-4 shadow-inner">
                            <p className="text-xs font-black text-blue-700 flex items-center gap-2 uppercase tracking-widest">
                                <Bed size={16} />
                                {editingRoomId ? 'Edit Kamar' : 'Tambah Kamar Baru'}
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="No. Kamar"
                                    placeholder="Contoh: 101, 102"
                                    value={roomFormData.nomor}
                                    onChange={(e) => setRoomFormData({ ...roomFormData, nomor: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Kapasitas"
                                    type="number"
                                    value={roomFormData.kapasitas}
                                    onChange={(e) => setRoomFormData({ ...roomFormData, kapasitas: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                {editingRoomId && (
                                    <Button type="button" variant="outline" size="sm" className="rounded-xl px-6" onClick={() => { setEditingRoomId(null); setRoomFormData({ nomor: '', kapasitas: 10 }); }}>
                                        Batal
                                    </Button>
                                )}
                                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8" isLoading={isSubmitting}>
                                    {editingRoomId ? 'Simpan' : 'Tambah Kamar'}
                                </Button>
                            </div>
                        </form>

                        <div className="max-h-[300px] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-md">
                            <Table>
                                <TableHeader className="bg-slate-50 sticky top-0 backdrop-blur-md">
                                    <TableRow>
                                        <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-wider">No. Kamar</TableHead>
                                        <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-wider">Kapasitas</TableHead>
                                        <TableHead className="text-right font-black text-slate-600 text-[10px] uppercase tracking-wider">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(selectedAsrama?.kamar || []).length > 0 ? (
                                        (selectedAsrama.kamar as any[]).map((k: any) => (
                                            <TableRow key={k.id} className="hover:bg-blue-50/50 transition-colors border-slate-100">
                                                <TableCell className="font-bold text-slate-800">{k.nomor}</TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                                                        {k.kapasitas} Santri
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600 rounded-lg" onClick={() => { setEditingRoomId(k.id); setRoomFormData({ nomor: k.nomor, kapasitas: k.kapasitas }); }}>
                                                            <Edit2 size={14} />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg" onClick={() => deleteRoom(k.id)}>
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-12 text-slate-400 italic text-sm">Belum ada kamar terdaftar di gedung ini.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}