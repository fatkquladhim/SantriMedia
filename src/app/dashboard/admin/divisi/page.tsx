'use client'

import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import { Plus, Building2, Trash2, Edit2, AlertCircle } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

export default function AdminMasterDivisiPage() {
    const { data: divisi, isLoading, error, fetchData } = useApi('/divisi', { immediate: true })
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newDivisi, setNewDivisi] = useState({ nama: '', deskripsi: '' })
    const [editingDivisi, setEditingDivisi] = useState<any>(null)
    const [mutationError, setMutationError] = useState<string | null>(null)

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setMutationError(null)
        try {
            if (editingDivisi) {
                await apiFetch(`/divisi/${editingDivisi.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(newDivisi)
                })
            } else {
                await apiFetch('/divisi', {
                    method: 'POST',
                    body: JSON.stringify(newDivisi)
                })
            }
            setIsModalOpen(false)
            setNewDivisi({ nama: '', deskripsi: '' })
            setEditingDivisi(null)
            fetchData()
        } catch (err: any) {
            setMutationError(err?.message || 'Gagal menyimpan divisi.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (d: any) => {
        setEditingDivisi(d)
        setMutationError(null)
        setNewDivisi({ nama: d.nama, deskripsi: d.deskripsi || '' })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus divisi ini?')) return
        setMutationError(null)
        try {
            await apiFetch(`/divisi/${id}`, { method: 'DELETE' })
            fetchData()
        } catch (err: any) {
            setMutationError(err?.message || 'Gagal menghapus divisi.')
        }
    }

    // Define table columns
    const columns: ColumnDef<any>[] = [
        {
            accessorKey: 'nama',
            header: 'Nama Divisi',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
                        <Building2 size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 leading-none">{row.getValue('nama')}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">
                            ID: {row.original.id.substring(0, 8)}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'deskripsi',
            header: 'Deskripsi',
            cell: ({ row }) => (
                <p className="text-sm text-slate-600 line-clamp-2 max-w-sm">
                    {row.getValue('deskripsi') || '-'}
                </p>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Aksi</div>,
            cell: ({ row }) => {
                const divisi = row.original
                return (
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="p-2 h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" onClick={() => handleEdit(divisi)}>
                            <Edit2 size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="p-2 h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-100"
                            onClick={() => handleDelete(divisi.id)}
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">Master Data Divisi</h1>
                    <p className="text-slate-500 mt-1">Kelola struktur organisasi dan unit kerja pesantren.</p>
                </div>
                <Button
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-transform active:scale-95"
                    onClick={() => { setEditingDivisi(null); setNewDivisi({ nama: '', deskripsi: '' }); setIsModalOpen(true); }}
                >
                    <Plus size={18} />
                    Tambah Divisi
                </Button>
            </div>

            {(error || mutationError) && (
                <div className="p-4 rounded-xl bg-rose-50/80 backdrop-blur-sm border border-rose-200 text-rose-700 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 shadow-sm">
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
                            data={divisi || []}
                            searchKey="nama"
                            searchPlaceholder="Cari nama divisi..."
                        />
                    )}
                </div>

                {/* Info Card Sidebar */}
                <div className="md:col-span-1">
                    <div className="glass-panel p-6 rounded-3xl sticky top-24">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Statistik</h3>
                        <div className="space-y-4">
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 border border-blue-100 relative overflow-hidden group shadow-sm">
                                <div className="absolute top-0 right-0 p-4 translate-x-2 -translate-y-2 opacity-10 group-hover:scale-110 transition-transform duration-500 text-blue-600">
                                    <Building2 size={80} />
                                </div>
                                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest relative z-10">Total Divisi</p>
                                <p className="text-4xl font-black text-blue-900 mt-1 relative z-10">{divisi?.length || 0}</p>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Data master divisi ini digunakan untuk pengelompokan staf inti dan delegasi tugas.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingDivisi ? "Edit Divisi" : "Tambah Divisi Baru"}
                description={editingDivisi ? "Perbarui detail birokrasi/divisi organisasi." : "Masukkan detail divisi organisasi baru."}
            >
                <form onSubmit={handleCreate} className="space-y-5">
                    <Input
                        label="Nama Divisi"
                        placeholder="Contoh: Divisi Keamanan, Divisi Pendidikan"
                        value={newDivisi.nama}
                        onChange={(e) => setNewDivisi({ ...newDivisi, nama: e.target.value })}
                        required
                    />
                    <div className="space-y-1.5 focus-within:text-blue-700 transition-colors">
                        <label className="text-sm font-bold text-slate-700 ml-1">Deskripsi Divisi</label>
                        <textarea
                            className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all resize-none shadow-inner"
                            placeholder="Jelaskan peran atau lingkup kerja divisi ini..."
                            value={newDivisi.deskripsi}
                            onChange={(e) => setNewDivisi({ ...newDivisi, deskripsi: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700" isLoading={isSubmitting}>
                            {editingDivisi ? "Simpan Perubahan" : "Simpan Divisi"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}