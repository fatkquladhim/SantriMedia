'use client'

import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable } from '@/components/ui/DataTable'
import { Monitor, Plus, Globe, Trash2, Edit2, Activity, AlertCircle } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

export default function MasterPlatformPage() {
    const { data: platforms, isLoading, error, fetchData } = useApi('/platform', { immediate: true })
    const { data: divisi } = useApi('/divisi', { immediate: true })

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingPlatform, setEditingPlatform] = useState<any>(null)
    const [formData, setFormData] = useState({
        nama: '',
        divisi_id: '',
        deskripsi: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            if (editingPlatform) {
                await apiFetch(`/platform/${editingPlatform.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                })
            } else {
                await apiFetch('/platform', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                })
            }
            setIsModalOpen(false)
            setFormData({ nama: '', divisi_id: '', deskripsi: '' })
            setEditingPlatform(null)
            fetchData()
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (p: any) => {
        setEditingPlatform(p)
        setFormData({
            nama: p.nama,
            divisi_id: p.divisi_id || '',
            deskripsi: p.deskripsi || ''
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus platform ini?')) return
        try {
            await apiFetch(`/platform/${id}`, { method: 'DELETE' })
            fetchData()
        } catch (err) {
            console.error(err)
        }
    }

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: 'nama',
            header: 'Nama Platform',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
                        <Globe size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 leading-none">{row.getValue('nama')}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">
                            ID: {row.original.id.substring(0, 8)}
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'divisi',
            header: 'Divisi',
            cell: ({ row }) => {
                const div = row.original.divisi?.nama
                return div ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {div}
                    </span>
                ) : (
                    <span className="text-slate-400 italic text-sm">-</span>
                )
            }
        },
        {
            accessorKey: 'deskripsi',
            header: 'Deskripsi',
            cell: ({ row }) => (
                <p className="text-sm text-slate-600 line-clamp-2 max-w-[200px]">
                    {row.getValue('deskripsi') || '-'}
                </p>
            )
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Aksi</div>,
            cell: ({ row }) => {
                const platform = row.original
                return (
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="p-2 h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" onClick={() => handleEdit(platform)}>
                            <Edit2 size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="p-2 h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-100"
                            onClick={() => handleDelete(platform.id)}
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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">Manajemen Platform</h1>
                    <p className="text-slate-500 mt-1">Kelola channel distribusi konten (Website, App, Sosial Media).</p>
                </div>
                <Button
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-transform active:scale-95"
                    onClick={() => { setEditingPlatform(null); setFormData({ nama: '', divisi_id: '', deskripsi: '' }); setIsModalOpen(true); }}
                >
                    <Plus size={18} />
                    Tambah Platform
                </Button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-rose-50/80 backdrop-blur-sm border border-rose-200 text-rose-700 flex items-center gap-3 shadow-sm">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
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
                            data={platforms || []}
                            searchKey="nama"
                            searchPlaceholder="Cari nama platform..."
                        />
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="md:col-span-1 space-y-4">
                    <div className="glass-panel p-6 rounded-3xl sticky top-24">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-blue-600" />
                            Metrics
                        </h3>
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 border-none relative overflow-hidden group shadow-lg shadow-blue-200">
                            <div className="absolute top-0 right-0 p-4 translate-x-2 -translate-y-2 opacity-10 group-hover:scale-110 transition-transform duration-500 text-white">
                                <Monitor size={80} />
                            </div>
                            <p className="text-xs font-bold text-blue-100 uppercase tracking-widest relative z-10">Total Platform</p>
                            <p className="text-4xl font-black text-white mt-1 relative z-10">{platforms?.length || 0}</p>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-200/50">
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Platform merepresentasikan outlet distribusi dari Divisi operasional Multimedia Pesantren.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPlatform ? "Edit Platform" : "Tambah Platform Baru"}
                description="Lengkapi detail platform distribusi konten."
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        label="Nama Platform"
                        placeholder="Contoh: Website, Instagram, YouTube"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        required
                    />
                    <Select
                        label="Divisi Terkait"
                        options={(divisi || []).map((d: any) => ({ value: d.id, label: d.nama }))}
                        value={formData.divisi_id}
                        onChange={(e) => setFormData({ ...formData, divisi_id: e.target.value })}
                        required
                    />
                    <div className="space-y-1.5 focus-within:text-blue-700 transition-colors">
                        <label className="text-sm font-bold text-slate-700 ml-1">Deskripsi</label>
                        <textarea
                            className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all resize-none shadow-inner"
                            placeholder="Maksud/tujuan penggunaan platform ini..."
                            value={formData.deskripsi}
                            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700 text-white" isLoading={isSubmitting}>
                            {editingPlatform ? "Simpan Perubahan" : "Simpan Platform"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}