'use client'

import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable } from '@/components/ui/DataTable'
import { 
    Box, 
    Plus, 
    CheckCircle2, 
    XCircle, 
    RefreshCw, 
    AlertCircle, 
    Camera, 
    Mic, 
    HardDrive,
    User,
    Clock,
    ClipboardCheck,
    Trash2,
    Edit2,
    Upload
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function AdminInventarisPage() {
    // Data Fetching
    const { data: catalog, isLoading: isLoadingCatalog, fetchData: fetchCatalog } = useApi('/inventaris', { immediate: true })
    const { data: requests, isLoading: isLoadingRequests, fetchData: fetchRequests } = useApi('/inventaris/pinjam?status=pending', { immediate: true })
    const { data: activeBorrows, isLoading: isLoadingActive, fetchData: fetchActive } = useApi('/inventaris/pinjam?status=approved', { immediate: true })

    const [isItemModalOpen, setIsItemModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [importing, setImporting] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [itemForm, setItemForm] = useState({
        nama: '',
        kategori: 'Kamera',
        serial_number: '',
        is_available: true
    })
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importResult, setImportResult] = useState<any>(null)

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            if (editingItem) {
                await apiFetch(`/inventaris/${editingItem.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(itemForm)
                })
            } else {
                await apiFetch('/inventaris', {
                    method: 'POST',
                    body: JSON.stringify(itemForm)
                })
            }
            setIsItemModalOpen(false)
            setEditingItem(null)
            setItemForm({ nama: '', kategori: 'Kamera', serial_number: '', is_available: true })
            fetchCatalog()
        } catch (err) {
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }

    const handleApprove = async (id: string) => {
        if (!confirm('Setujui peminjaman ini? Pastikan unit alat sudah diserahkan ke santri.')) return
        try {
            await apiFetch(`/inventaris/pinjam/${id}/approve`, { method: 'PATCH' })
            fetchRequests()
            fetchActive()
            fetchCatalog()
        } catch (err) { console.error(err) }
    }

    const handleReject = async (id: string) => {
        const catat = prompt('Alasan penolakan:')
        if (catat === null) return
        try {
            await apiFetch(`/inventaris/pinjam/${id}/reject`, { 
                method: 'PATCH',
                body: JSON.stringify({ catatan: catat })
            })
            fetchRequests()
        } catch (err) { console.error(err) }
    }

    const handleReturn = async (id: string) => {
        if (!confirm('Konfirmasi pengembalian alat? Pastikan kondisi fisik alat sudah dicek dengan teliti.')) return
        try {
            await apiFetch(`/inventaris/pinjam/${id}/return`, { method: 'PATCH' })
            fetchActive()
            fetchCatalog()
        } catch (err) { console.error(err) }
    }

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Yakin ingin menghapus alat ini dari database? Tindakan ini tidak dapat dibatalkan.')) return
        try {
            await apiFetch(`/inventaris/${id}`, { method: 'DELETE' })
            fetchCatalog()
        } catch (err) { console.error(err) }
    }

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!importFile) return
        setImporting(true)
        setImportResult(null)
        try {
            const formData = new FormData()
            formData.append('file', importFile)
            const res = await apiFetch('/inventaris/import', {
                method: 'POST',
                body: formData,
            })
            setImportResult(res)
            fetchCatalog()
        } catch (err: any) {
            alert(err.message || 'Gagal import data')
        } finally {
            setImporting(false)
        }
    }

    const catalogColumns: ColumnDef<any>[] = [
        {
            accessorKey: 'nama',
            header: 'Nama Alat',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <Camera size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 leading-none">{row.original.nama}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase">SN: {row.original.serial_number || '-'}</p>
                    </div>
                </div>
            )
        },
        { accessorKey: 'kategori', header: 'Kategori' },
        {
            accessorKey: 'is_available',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    row.original.is_available 
                    ? 'bg-blue-100 text-blue-700 border-blue-200' 
                    : 'bg-amber-100 text-amber-700 border-amber-200'
                }`}>
                    {row.original.is_available ? 'Ready' : 'Pinjam'}
                </span>
            )
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Aksi</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 text-blue-600" onClick={() => {
                        setEditingItem(row.original)
                        setItemForm({
                            nama: row.original.nama,
                            kategori: row.original.kategori,
                            serial_number: row.original.serial_number || '',
                            is_available: row.original.is_available
                        })
                        setIsItemModalOpen(true)
                    }}>
                        <Edit2 size={14} />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg hover:bg-rose-50 text-rose-600 border-rose-100" 
                        onClick={() => handleDeleteItem(row.original.id)}
                        disabled={!row.original.is_available} // Jangan hapus jika sedang dipinjam
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            )
        }
    ]

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-900/10 border border-white/10">
                        <Box size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase leading-none">Pusat Kendali Alat</h1>
                        <p className="text-slate-500 font-medium mt-1">Kelola Aset Multimedia & Validasi Peminjaman Unit.</p>
                    </div>
                </div>
                <Button 
                    onClick={() => { setEditingItem(null); setItemForm({ nama: '', kategori: 'Kamera', serial_number: '', is_available: true }); setIsItemModalOpen(true); }}
                    className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl"
                >
                    <Plus size={18} /> Daftarkan Alat Baru
                </Button>
                <Button 
                    onClick={() => { setIsImportModalOpen(true); setImportResult(null); setImportFile(null); }}
                    variant="outline"
                    className="h-14 px-8 rounded-2xl border-slate-200 text-slate-700 font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-slate-50 transition-all"
                >
                    <Upload size={18} /> Import Excel
                </Button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { label: 'Menunggu Validasi', val: requests?.data?.length || 0, icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Unit Di Luar', val: activeBorrows?.data?.length || 0, icon: ClipboardCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Total Aset', val: catalog?.data?.length || 0, icon: HardDrive, color: 'text-blue-500', bg: 'bg-blue-50' },
                ].map((stat, i) => (
                    <div key={i} className="glass-panel p-8 rounded-[40px] flex items-center gap-6 border-white shadow-lg shadow-slate-200/50">
                        <div className={`p-4 rounded-3xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
                {/* Requests Table */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Permohonan Pinjam</h2>
                        <div className="h-[2px] flex-1 bg-slate-100"></div>
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-black">{requests?.data?.length || 0} Baru</Badge>
                    </div>

                    <div className="space-y-4">
                        {isLoadingRequests ? (
                            <div className="h-40 rounded-[40px] bg-slate-100 animate-pulse"></div>
                        ) : requests?.data?.length > 0 ? (
                            requests.data.map((r: any) => (
                                <div key={r.id} className="glass-panel p-6 rounded-[35px] border-amber-100 bg-amber-50/20 group hover:border-amber-300 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white border border-amber-100 flex items-center justify-center text-amber-500">
                                                <Camera size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 uppercase text-sm tracking-tight">{r.alat?.nama}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><User size={10}/> {r.user?.full_name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wajib Kembali</p>
                                            <p className="text-xs font-bold text-rose-500">{format(new Date(r.estimasi_kembali), 'dd MMM HH:mm', { locale: id })}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-4">
                                        <Button 
                                            onClick={() => handleApprove(r.id)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-11 font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-blue-500/10"
                                        >
                                            <CheckCircle2 size={16} /> Setujui & Berikan
                                        </Button>
                                        <Button 
                                            onClick={() => handleReject(r.id)}
                                            variant="outline" 
                                            className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-2xl h-11 font-black text-[10px] uppercase tracking-widest gap-2"
                                        >
                                            <XCircle size={16} /> Tolak
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center glass-panel rounded-[40px] border-dashed border-2 border-slate-100">
                                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Tidak ada permohonan baru.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Loans Table */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Distribusi Unit Aktif</h2>
                        <div className="h-[2px] flex-1 bg-slate-100"></div>
                    </div>

                    <div className="glass-panel rounded-[40px] overflow-hidden border-white shadow-xl shadow-slate-200/50">
                        {isLoadingActive ? (
                            <div className="h-60 bg-white animate-pulse"></div>
                        ) : (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full min-w-[600px] text-left border-collapse">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Peminjam</th>
                                            <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Info Unit</th>
                                            <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {activeBorrows?.data?.map((b: any) => (
                                            <tr key={b.id} className="hover:bg-blue-50/50 transition-colors">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                                            {b.user?.full_name?.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-slate-700 text-sm">{b.user?.full_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="font-bold text-slate-900 text-sm">{b.alat?.nama}</p>
                                                    <p className="text-[10px] text-rose-500 font-bold uppercase">Batas: {format(new Date(b.estimasi_kembali), 'dd MMM HH:mm', { locale: id })}</p>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <Button 
                                                        onClick={() => handleReturn(b.id)}
                                                        className="h-8 px-4 rounded-lg bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 shadow-md"
                                                    >
                                                        Konfirmasi Kembali
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!activeBorrows?.data || activeBorrows.data.length === 0) && (
                                            <tr><td colSpan={3} className="px-6 py-20 text-center text-slate-300 italic text-sm font-medium">Belum ada unit yang dipinjam keluar.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Catalog Management Section */}
            <div className="space-y-6">
                 <div className="flex items-center gap-4 px-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Katalog Aset Utama</h2>
                    <div className="h-[2px] flex-1 bg-slate-100"></div>
                </div>
                <div className="glass-panel p-2 rounded-[40px] border-white shadow-2xl shadow-slate-200/50">
                    <DataTable columns={catalogColumns} data={catalog?.data || []} searchKey="nama" searchPlaceholder="Cari nama alat..." />
                </div>
            </div>

            {/* Modal Item */}
            <Modal
                isOpen={isItemModalOpen}
                onClose={() => { setIsItemModalOpen(false); setEditingItem(null); }}
                title={editingItem ? 'Edit Aset Unit' : 'Daftarkan Barang Baru'}
                description="Masukkan detail spesifikasi unit alat multimedia baru ke database."
            >
                <form onSubmit={handleSaveItem} className="space-y-5 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Nama Unit/Alat" required value={itemForm.nama} onChange={e => setItemForm({...itemForm, nama: e.target.value})} />
                        <Select 
                            label="Kategori" 
                            value={itemForm.kategori} 
                            onChange={e => setItemForm({...itemForm, kategori: e.target.value})}
                            options={[
                                { value: 'Kamera', label: '📸 Kamera / Lensa' },
                                { value: 'Audio', label: '🎙️ Audio / Mic' },
                                { value: 'Lighting', label: '💡 Lighting' },
                                { value: 'Monitor', label: '🖥️ Monitor / Display' },
                                { value: 'Aksesoris', label: '🎮 Aksesoris / Tripod' },
                            ]}
                        />
                    </div>
                    <Input label="Nomer Seri (Serial Number)" value={itemForm.serial_number} onChange={e => setItemForm({...itemForm, serial_number: e.target.value})} />
                    
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                         <Button type="button" variant="outline" className="rounded-xl h-12" onClick={() => setIsItemModalOpen(false)}>Batalkan</Button>
                         <Button type="submit" isLoading={submitting} className="bg-slate-900 text-white rounded-xl px-8 h-12 font-black uppercase tracking-widest text-[10px] shadow-xl">
                             {editingItem ? 'Update Aset' : 'Simpan ke Katalog'}
                         </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Import */}
            <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Data Alat" size="lg">
                <form onSubmit={handleImport} className="space-y-6 py-4">
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-800 text-sm flex gap-3">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        Upload file Excel/CSV dengan kolom: <strong>nama, kategori, serial_number, is_available, kondisi, lokasi</strong>.
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">File Excel/CSV</label>
                        <input type="file" accept=".xlsx,.xls,.csv" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" onChange={e => setImportFile(e.target.files?.[0] || null)} />
                        {importFile && <p className="text-xs text-slate-500">{importFile.name}</p>}
                    </div>
                    {importResult && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-sm space-y-1">
                            <p className="font-bold text-emerald-800">Import selesai!</p>
                            <p className="text-emerald-700">{importResult.imported?.length || 0} berhasil diimport</p>
                            {(importResult.errors?.length || 0) > 0 && (
                                <div className="mt-2 max-h-32 overflow-y-auto text-xs text-rose-600">
                                    {(importResult.errors || []).slice(0, 20).map((err: any, i: number) => (
                                        <div key={i}>Baris {err.row}: {err.error}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <Button type="button" variant="outline" className="rounded-xl h-12" onClick={() => setIsImportModalOpen(false)} disabled={importing}>Tutup</Button>
                        <Button type="submit" isLoading={importing} className="bg-blue-600 text-white rounded-xl px-8 h-12 font-black uppercase tracking-widest text-[10px] shadow-xl">
                            <Upload size={16} className="mr-2" /> Import Sekarang
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={`inline-flex items-center px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 ${className}`}>{children}</span>
}