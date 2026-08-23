'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useApi, invalidateCache } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import {
    HargaSewaItem, KategoriSewa,
    mapHargaFromApi, mapHargaToApi,
} from '@/features/staff-alat/lib/staffAlatTypes'
import { formatRupiah, getErrorMessage } from '@/features/staff-alat/lib/staffAlatUtils'
import {
    Tag, Plus, Edit2, Trash2, Search, Filter, Info,
    FileOutput, FileInput, CheckCircle2,
} from 'lucide-react'

interface TarifForm {
    namaAlat: string
    kategori: KategoriSewa
    jumlah: number
    harga: number
    alatId: string | null
}

const emptyForm: TarifForm = {
    namaAlat: '',
    kategori: 'Umum',
    jumlah: 1,
    harga: 0,
    alatId: null,
}

export default function TarifTab() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<'Semua' | KategoriSewa>('Semua')

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<TarifForm>(emptyForm)
    const [submitting, setSubmitting] = useState(false)

    const [isImportOpen, setIsImportOpen] = useState(false)
    const [pendingImportItems, setPendingImportItems] = useState<{ namaAlat: string; kategori: 'Umum' | 'Paket Santri'; jumlah: number; harga: number }[]>([])
    const excelInputRef = useRef<HTMLInputElement>(null)

    const { data: hargaRes, isLoading: isLoadingHarga, error: hargaError, fetchData: fetchHarga } = useApi('/staff-alat/harga-sewa?limit=100', { immediate: false })
    const hargaSewaList: HargaSewaItem[] = useMemo(() => (hargaRes?.data || []).map(mapHargaFromApi), [hargaRes])

    useEffect(() => {
        fetchHarga()
    }, [fetchHarga])

    const handleRefresh = async () => {
        invalidateCache('/staff-alat/harga-sewa?limit=100')
        await fetchHarga()
    }

    const filteredList = useMemo(() => {
        return hargaSewaList.filter((item) => {
            const matchesSearch = item.namaAlat.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory = selectedCategory === 'Semua' || item.kategori === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [hargaSewaList, searchTerm, selectedCategory])

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.namaAlat.trim()) return
        setSubmitting(true)
        try {
            await apiFetch('/staff-alat/harga-sewa', {
                method: 'POST',
                body: JSON.stringify(mapHargaToApi(form)),
            })
            setIsFormOpen(false)
            await handleRefresh()
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Gagal menambah tarif'))
        } finally {
            setSubmitting(false)
        }
    }

    const openEditForm = (item: HargaSewaItem) => {
        setEditingId(item.id)
        setForm({
            namaAlat: item.namaAlat,
            kategori: item.kategori,
            jumlah: item.jumlah || 1,
            harga: item.harga,
            alatId: item.alatId,
        })
        setIsFormOpen(true)
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingId || !form.namaAlat.trim()) return
        setSubmitting(true)
        try {
            await apiFetch(`/staff-alat/harga-sewa/${editingId}`, {
                method: 'PUT',
                body: JSON.stringify(mapHargaToApi(form)),
            })
            setIsFormOpen(false)
            await handleRefresh()
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Gagal mengupdate tarif'))
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (item: HargaSewaItem) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus tarif sewa untuk "${item.namaAlat}"?`)) return
        try {
            await apiFetch(`/staff-alat/harga-sewa/${item.id}`, { method: 'DELETE' })
            await handleRefresh()
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Gagal menghapus tarif'))
        }
    }

    const handleExcelSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const { parseTarifFile } = await import('@/features/staff-alat/lib/excelService')
            const parsed = await parseTarifFile(file)
            if (parsed.length === 0) {
                alert('Tidak ada data tarif yang valid ditemukan dalam file Excel tersebut.')
                return
            }
            setPendingImportItems(parsed)
            setIsImportOpen(true)
        } catch (err: unknown) {
            alert(`Gagal membaca file Excel: ${getErrorMessage(err, 'Format tidak valid')}`)
        } finally {
            if (excelInputRef.current) excelInputRef.current.value = ''
        }
    }

    const handleConfirmImport = async (mode: 'replace' | 'merge') => {
        setSubmitting(true)
        try {
            if (mode === 'replace') {
                for (const item of hargaSewaList) {
                    try { await apiFetch(`/staff-alat/harga-sewa/${item.id}`, { method: 'DELETE' }) } catch { /* lanjut */ }
                }
            }
            let success = 0
            let failed = 0
            const existingNames = new Set(hargaSewaList.map((h) => h.namaAlat.toLowerCase()))
            for (const item of pendingImportItems) {
                if (mode === 'merge' && existingNames.has(item.namaAlat.toLowerCase())) continue
                try {
                    await apiFetch('/staff-alat/harga-sewa', {
                        method: 'POST',
                        body: JSON.stringify(mapHargaToApi(item)),
                    })
                    success += 1
                } catch {
                    failed += 1
                }
            }
            alert(mode === 'replace'
                ? `Berhasil mengganti data dengan ${success} tarif dari Excel${failed ? `, ${failed} gagal` : ''}.`
                : `Berhasil menambahkan ${success} tarif baru dari Excel${failed ? `, ${failed} gagal` : ''}.`)
            setPendingImportItems([])
            setIsImportOpen(false)
            await handleRefresh()
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2.5">
                        <Tag size={24} className="text-amber-500" /> Tarif Harga Sewa Alat
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mt-0.5">Kelola daftar tarif sewa alat untuk kategori Umum dan Paket Santri.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={async () => {
                        const { downloadTarifExcel } = await import('@/features/staff-alat/lib/excelService')
                        downloadTarifExcel(hargaSewaList)
                    }} tooltip="Ekspor seluruh tarif ke Excel (.xlsx)">
                        <FileOutput size={16} className="text-emerald-500" /> Ekspor .xlsx
                    </Button>
                    <input
                        ref={excelInputRef}
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleExcelSelect}
                        className="hidden"
                    />
                    <Button variant="outline" onClick={() => excelInputRef.current?.click()} tooltip="Impor tarif dari file Excel (.xlsx / .csv)">
                        <FileInput size={16} className="text-blue-500" /> Impor Excel
                    </Button>
                    <Button onClick={() => { setEditingId(null); setForm(emptyForm); setIsFormOpen(true) }} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl">
                        <Plus size={16} /> Tambah Tarif Baru
                    </Button>
                </div>
            </div>

            {/* Info banner */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs leading-relaxed text-amber-800">
                <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold block text-amber-700 mb-0.5">Aturan Penghitungan Otomatis:</span>
                    Saat membuat transaksi penyewaan baru, memilih nama alat dan kategori akan otomatis mengisi harga sewa dan jumlah unit sesuai tarif di halaman ini.
                </div>
            </div>

            {/* Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-5 rounded-2xl border-amber-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Master Tarif</p>
                    <p className="text-2xl font-black text-amber-500">{hargaSewaList.length} Barang</p>
                </Card>
                <Card className="p-5 rounded-2xl border-blue-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori Umum</p>
                    <p className="text-2xl font-black text-blue-600">{hargaSewaList.filter((h) => h.kategori === 'Umum').length} Item</p>
                </Card>
                <Card className="p-5 rounded-2xl border-purple-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paket Khusus Santri</p>
                    <p className="text-2xl font-black text-purple-600">{hargaSewaList.filter((h) => h.kategori === 'Paket Santri').length} Item</p>
                </Card>
            </div>

            {/* Table */}
            <Card className="p-5 rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama alat..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                        />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1"><Filter size={14} /> Kategori:</span>
                        {(['Semua', 'Umum', 'Paket Santri'] as const).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    selectedCategory === cat ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs md:text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 font-black uppercase tracking-wider text-slate-500">
                                <th className="p-3">Nama Alat</th>
                                <th className="p-3">Kategori</th>
                                <th className="p-3 text-center">Jumlah Standard</th>
                                <th className="p-3 text-right">Harga Sewa</th>
                                <th className="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {isLoadingHarga && hargaSewaList.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Memuat data...</td></tr>
                            ) : hargaError ? (
                                <tr><td colSpan={5} className="p-8 text-center text-rose-600 font-medium">Gagal memuat tarif: {hargaError}</td></tr>
                            ) : filteredList.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Tidak ada tarif harga sewa yang cocok dengan pencarian.</td></tr>
                            ) : (
                                filteredList.map((item) => (
                                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                                        <td className="p-3 font-semibold text-slate-900">{item.namaAlat}</td>
                                        <td className="p-3">
                                            <Badge className={item.kategori === 'Paket Santri' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>
                                                {item.kategori}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-xs font-bold">{item.jumlah || 1} unit</span>
                                        </td>
                                        <td className="p-3 text-right font-mono text-emerald-600 font-bold">{formatRupiah(item.harga)}</td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-blue-600 hover:bg-blue-50" tooltip="Ubah Detail Tarif" onClick={() => openEditForm(item)}>
                                                    <Edit2 size={14} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:bg-rose-50" tooltip="Hapus Tarif" onClick={() => handleDelete(item)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add/Edit Form Modal */}
            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingId ? 'Ubah Tarif Harga Sewa' : 'Tambah Tarif Harga Sewa'}
                description="Tarif dipakai untuk auto-fill harga saat transaksi sewa baru."
            >
                <form onSubmit={editingId ? handleEditSubmit : handleAddSubmit} className="space-y-4 py-2">
                    <Input label="Nama Alat" required placeholder="Contoh: Kamera Sony A6400" value={form.namaAlat} onChange={(e) => setForm({ ...form, namaAlat: e.target.value })} />
                    <Select
                        label="Kategori Tarif"
                        value={form.kategori}
                        onChange={(e) => setForm({ ...form, kategori: e.target.value as KategoriSewa })}
                        options={[
                            { value: 'Umum', label: 'Umum' },
                            { value: 'Paket Santri', label: 'Paket Santri' },
                        ]}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Jumlah Barang (Unit)" type="number" min={1} required value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: Math.max(1, parseInt(e.target.value) || 1) })} />
                        <Input label="Harga Sewa (Rp)" type="number" min={0} required placeholder="Contoh: 100000" value={form.harga} onChange={(e) => setForm({ ...form, harga: Math.max(0, parseInt(e.target.value) || 0) })} />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
                        <Button type="submit" isLoading={submitting} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl">
                            {editingId ? 'Simpan Perubahan' : 'Simpan Tarif'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Import Confirm Modal */}
            <Modal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                title="Konfirmasi Impor Data Tarif Excel"
                description="Pilih metode impor data tarif sewa."
            >
                <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs leading-relaxed text-emerald-800">
                        <span className="font-bold block text-emerald-700 mb-1 flex items-center gap-1.5">
                            <CheckCircle2 size={16} className="text-emerald-500" /> File Excel Terbaca
                        </span>
                        Ditemukan <strong className="text-emerald-900">{pendingImportItems.length} tarif</strong> dalam file yang diunggah.
                    </div>
                    {pendingImportItems.length > 0 && (
                        <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto p-2 bg-slate-50 divide-y divide-slate-100 text-xs">
                            {pendingImportItems.slice(0, 5).map((item, i) => (
                                <div key={i} className="py-1.5 px-2 flex items-center justify-between">
                                    <span className="font-medium text-slate-800 truncate max-w-[180px]">{item.namaAlat}</span>
                                    <span className="font-mono text-emerald-600">{formatRupiah(item.harga)}</span>
                                </div>
                            ))}
                            {pendingImportItems.length > 5 && (
                                <div className="py-1 px-2 text-[10px] text-slate-400 italic text-center">...dan {pendingImportItems.length - 5} item lainnya</div>
                            )}
                        </div>
                    )}
                    <div className="flex flex-col gap-2.5 pt-2">
                        <Button
                            onClick={() => handleConfirmImport('merge')}
                            isLoading={submitting}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                        >
                            Gabungkan Dengan Tarif Saat Ini <span className="text-[10px] opacity-75 font-mono">(Rekomendasi)</span>
                        </Button>
                        <Button
                            onClick={() => handleConfirmImport('replace')}
                            isLoading={submitting}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                        >
                            Ganti Seluruh Tarif Lama <span className="text-[10px] opacity-75 font-mono">(Hapus Data Lama)</span>
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsImportOpen(false)} className="w-full">Batal</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
