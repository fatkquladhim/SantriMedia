'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useApi, invalidateCache } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
    Alat,
    KondisiAlat,
    KONDISI_LABEL,
    KONDISI_LABEL_TO_VALUE,
    mapAlatFromApi,
    mapAlatToApi,
    Sewa,
} from '@/features/staff-alat/lib/staffAlatTypes'
import {
    calculateRentedCountForTool,
    getToolStatus,
    getErrorMessage,
} from '@/features/staff-alat/lib/staffAlatUtils'
import {
    ArrowUpDown, Search, Plus, Download, Filter, Upload, Trash2, Edit2,
    Image as ImageIcon, FileSpreadsheet, Package, Eye, X, RefreshCw,
} from 'lucide-react'
import Image from 'next/image'

type SortField = 'nama' | 'kategori' | 'kondisi' | 'jumlah'
type SortOrder = 'asc' | 'desc'

const IMAGE_PRESETS: { key: string; url: string }[] = [
    { key: 'kamera', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80' },
    { key: 'canon', url: 'https://images.unsplash.com/photo-1502920917128-1da500764c6e?w=600&auto=format&fit=crop&q=80' },
    { key: 'camcorder', url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&auto=format&fit=crop&q=80' },
    { key: 'mic', url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80' },
    { key: 'tripod', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80' },
    { key: 'switcher', url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&auto=format&fit=crop&q=80' },
    { key: 'laptop', url: 'https://images.unsplash.com/photo-1496181130204-755241524eab?w=600&auto=format&fit=crop&q=80' },
    { key: 'printer', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=80' },
]

interface AlatForm {
    nama: string
    kategori: string
    kondisi: KondisiAlat
    jumlah: number
    keterangan: string
    gambar: string
    serial_number: string
    lokasi_penyimpanan: string
}

const emptyForm: AlatForm = {
    nama: '',
    kategori: 'Fotografi',
    kondisi: 'baik',
    jumlah: 1,
    keterangan: '',
    gambar: IMAGE_PRESETS[0].url,
    serial_number: '',
    lokasi_penyimpanan: '',
}

export default function DataAlatTab() {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterKategori, setFilterKategori] = useState('Semua')
    const [filterKondisi, setFilterKondisi] = useState('Semua')
    const [sortField, setSortField] = useState<SortField>('nama')
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<AlatForm>(emptyForm)
    const [submitting, setSubmitting] = useState(false)
    const [customImageBase64, setCustomImageBase64] = useState('')

    const [isImportOpen, setIsImportOpen] = useState(false)
    const [parsedImportItems, setParsedImportItems] = useState<{ nama: string; kategori: string; kondisi: string; jumlah: number; keterangan: string }[]>([])
    const [importFileName, setImportFileName] = useState('')
    const [isParsing, setIsParsing] = useState(false)
    const importInputRef = useRef<HTMLInputElement>(null)

    const [viewImage, setViewImage] = useState<{ src: string; name: string } | null>(null)

    const { data: alatRes, isLoading: isLoadingAlat, fetchData: fetchAlat } = useApi('/inventaris?limit=100', { immediate: false })
    const { data: kategoriRes, fetchData: fetchKategori } = useApi('/inventaris/kategori', { immediate: false })
    const { data: sewaRes, isLoading: isLoadingSewa, fetchData: fetchSewa } = useApi('/staff-alat/sewa?limit=100', { immediate: false })

    const alat: Alat[] = useMemo(() => (alatRes?.data || []).map(mapAlatFromApi), [alatRes])
    const sewa: Sewa[] = useMemo(() => (sewaRes?.data || []).map((d: any) => ({ ...d, items: d.items || [] })), [sewaRes])
    const categories: string[] = useMemo(() => kategoriRes?.data?.kategori || [], [kategoriRes])

    const isLoading = isLoadingAlat || isLoadingSewa

    useEffect(() => {
        fetchAlat()
        fetchKategori()
        fetchSewa()
    }, [fetchAlat, fetchKategori, fetchSewa])

    const handleRefresh = async () => {
        invalidateCache('/inventaris?limit=100')
        invalidateCache('/inventaris/kategori')
        invalidateCache('/staff-alat/sewa?limit=100')
        await fetchAlat()
        await fetchKategori()
        await fetchSewa()
    }

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('asc')
        }
    }

    const filteredAlat = useMemo(() => {
        return [...alat]
            .filter((item) => {
                const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (item.keterangan || '').toLowerCase().includes(searchTerm.toLowerCase())
                const matchKategori = filterKategori === 'Semua' || item.kategori === filterKategori
                const matchKondisi = filterKondisi === 'Semua' || item.kondisi === filterKondisi
                return matchSearch && matchKategori && matchKondisi
            })
            .sort((a, b) => {
                let aVal: string | number = a[sortField] as string | number
                let bVal: string | number = b[sortField] as string | number
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase()
                    bVal = String(bVal).toLowerCase()
                }
                if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
                if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
                return 0
            })
    }, [alat, searchTerm, filterKategori, filterKondisi, sortField, sortOrder])

    const openAddForm = () => {
        setEditingId(null)
        setForm({ ...emptyForm, kategori: categories[0] || 'Fotografi' })
        setCustomImageBase64('')
        setIsFormOpen(true)
    }

    const openEditForm = (item: Alat) => {
        setEditingId(item.id)
        setForm({
            nama: item.nama,
            kategori: item.kategori,
            kondisi: item.kondisi,
            jumlah: item.jumlah || 1,
            keterangan: item.keterangan || '',
            gambar: item.gambar || '',
            serial_number: item.serial_number || '',
            lokasi_penyimpanan: item.lokasi_penyimpanan || '',
        })
        const isPreset = IMAGE_PRESETS.some((p) => p.url === item.gambar)
        setCustomImageBase64(item.gambar && !isPreset ? (item.gambar as string) : '')
        setIsFormOpen(true)
    }

    const processImageFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Hanya file gambar yang diperbolehkan!')
            return
        }
        const reader = new FileReader()
        reader.onload = (e) => {
            const base64 = e.target?.result as string
            setCustomImageBase64(base64)
            setForm((prev) => ({ ...prev, gambar: base64 }))
        }
        reader.readAsDataURL(file)
    }

    const uploadImage = async (base64OrUrl: string): Promise<string> => {
        if (!base64OrUrl) return ''
        if (base64OrUrl.startsWith('http') && !base64OrUrl.startsWith('data:')) return base64OrUrl
        const res = await fetch(base64OrUrl)
        const blob = await res.blob()
        const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : blob.type === 'image/gif' ? 'gif' : 'jpg'
        const file = new File([blob], `alat-upload.${ext}`, { type: blob.type || 'image/jpeg' })
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await apiFetch('/upload/alat-image', { method: 'POST', body: formData })
        return uploadRes?.data?.url || base64OrUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.nama.trim()) return
        setSubmitting(true)
        try {
            const gambarUrl = form.gambar ? await uploadImage(form.gambar) : null
            const payload = mapAlatToApi({
                nama: form.nama,
                kategori: form.kategori,
                kondisi: form.kondisi,
                jumlah: form.jumlah,
                keterangan: form.keterangan,
                gambar: gambarUrl,
                serial_number: form.serial_number,
                lokasi_penyimpanan: form.lokasi_penyimpanan,
            })
            if (editingId) {
                await apiFetch(`/inventaris/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
            } else {
                await apiFetch('/inventaris', { method: 'POST', body: JSON.stringify(payload) })
            }
            setIsFormOpen(false)
            await handleRefresh()
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Gagal menyimpan alat'))
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (item: Alat) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus "${item.nama}"?`)) return
        try {
            await apiFetch(`/inventaris/${item.id}`, { method: 'DELETE' })
            await handleRefresh()
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Gagal menghapus alat'))
        }
    }

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImportFileName(file.name)
        setIsParsing(true)
        try {
            const { parseAlatFile } = await import('@/features/staff-alat/lib/excelService')
            const items = await parseAlatFile(file, categories[0] || 'Fotografi')
            if (items.length === 0) {
                alert('Tidak dapat menemukan data alat dari file yang diunggah.')
            } else {
                setParsedImportItems(items)
                setIsImportOpen(true)
            }
        } catch (err) {
            console.error('Gagal membaca file:', err)
            alert('Terjadi kesalahan saat memproses file. Pastikan format file sesuai (.xlsx, .docx, .csv).')
        } finally {
            setIsParsing(false)
            e.target.value = ''
        }
    }

    const handleConfirmImport = async () => {
        if (parsedImportItems.length === 0) return
        setSubmitting(true)
        let success = 0
        let failed = 0
        try {
            for (const item of parsedImportItems) {
                try {
                    await apiFetch('/inventaris', {
                        method: 'POST',
                        body: JSON.stringify(mapAlatToApi({
                            nama: item.nama,
                            kategori: item.kategori,
                            kondisi: KONDISI_LABEL_TO_VALUE[item.kondisi] || 'baik',
                            jumlah: item.jumlah,
                            keterangan: item.keterangan || 'Hasil Impor Data',
                            gambar: IMAGE_PRESETS[0].url,
                        })),
                    })
                    success += 1
                } catch {
                    failed += 1
                }
            }
            alert(`Berhasil mengimpor ${success} data alat baru${failed > 0 ? `, ${failed} gagal` : ''}!`)
            setIsImportOpen(false)
            setParsedImportItems([])
            await handleRefresh()
        } finally {
            setSubmitting(false)
        }
    }

    const kondisiStyles: Record<string, string> = {
        baik: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        rusak_ringan: 'bg-amber-100 text-amber-700 border-amber-200',
        rusak_berat: 'bg-rose-100 text-rose-700 border-rose-200',
        maintenance: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        hilang: 'bg-sky-100 text-sky-700 border-sky-200',
    }

    const statusStyles: Record<string, string> = {
        'Tersedia': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Disewa': 'bg-blue-100 text-blue-700 border-blue-200',
        'Dipakai': 'bg-purple-100 text-purple-700 border-purple-200',
        'Diperbaiki': 'bg-amber-100 text-amber-700 border-amber-200',
        'Tidak Ada/Rusak': 'bg-rose-100 text-rose-700 border-rose-200',
    }

    const kondisiOptions = (Object.keys(KONDISI_LABEL) as KondisiAlat[]).map((k) => ({
        value: k,
        label: KONDISI_LABEL[k],
    }))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Data Alat Multimedia</h2>
                    <p className="text-slate-500 font-medium text-sm mt-0.5">Kelola data inventaris, status, dan kondisi fisik peralatan.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="file"
                        ref={importInputRef}
                        onChange={handleImportFile}
                        accept=".xlsx, .xls, .csv, .docx, .doc"
                        className="hidden"
                    />
                    <Button
                        variant="outline"
                        onClick={() => importInputRef.current?.click()}
                        disabled={isParsing}
                        tooltip="Impor data dari file Word (.docx) atau Excel (.xlsx/.xls/.csv)"
                    >
                        {isParsing ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} className="text-emerald-500" />}
                        {isParsing ? 'Memproses File...' : 'Impor Data (Word/Excel)'}
                    </Button>
                    <Button variant="outline" onClick={async () => {
                        const { downloadAlatExcel } = await import('@/features/staff-alat/lib/excelService')
                        downloadAlatExcel(filteredAlat)
                    }} tooltip="Ekspor data alat ke Excel">
                        <Download size={16} className="text-emerald-500" /> Ekspor Excel
                    </Button>
                    <Button onClick={openAddForm} className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl">
                        <Plus size={16} /> Tambah Alat
                    </Button>
                </div>
            </div>

            {/* Filter panel */}
            <Card className="p-4 rounded-2xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama alat atau keterangan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 h-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-slate-400 shrink-0" />
                        <Select
                            value={filterKategori}
                            onChange={(e) => setFilterKategori(e.target.value)}
                            options={[{ value: 'Semua', label: 'Semua Kategori' }, ...categories.map((c) => ({ value: c, label: c }))]}
                            placeholder="Pilih kategori"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Eye size={16} className="text-slate-400 shrink-0" />
                        <Select
                            value={filterKondisi}
                            onChange={(e) => setFilterKondisi(e.target.value)}
                            options={[{ value: 'Semua', label: 'Semua Kondisi' }, ...kondisiOptions.map((k) => ({ value: k.value, label: k.label }))]}
                            placeholder="Pilih kondisi"
                        />
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card className="overflow-hidden rounded-2xl">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-black uppercase tracking-wider text-slate-500">
                                <th className="p-4">Gambar</th>
                                <th onClick={() => handleSort('nama')} className="p-4 cursor-pointer hover:bg-slate-100">
                                    <span className="inline-flex items-center gap-1">Nama Alat <ArrowUpDown size={12} /></span>
                                </th>
                                <th onClick={() => handleSort('kategori')} className="p-4 cursor-pointer hover:bg-slate-100">
                                    <span className="inline-flex items-center gap-1">Kategori <ArrowUpDown size={12} /></span>
                                </th>
                                <th onClick={() => handleSort('kondisi')} className="p-4 cursor-pointer hover:bg-slate-100">
                                    <span className="inline-flex items-center gap-1">Kondisi <ArrowUpDown size={12} /></span>
                                </th>
                                <th className="p-4">Status</th>
                                <th onClick={() => handleSort('jumlah')} className="p-4 cursor-pointer hover:bg-slate-100">
                                    <span className="inline-flex items-center gap-1">Stok <ArrowUpDown size={12} /></span>
                                </th>
                                <th className="p-4">Sedang Disewa</th>
                                <th className="p-4">Keterangan</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {isLoading && alat.length === 0 ? (
                                <tr><td colSpan={9} className="p-12 text-center text-slate-400">Memuat data...</td></tr>
                            ) : filteredAlat.length === 0 ? (
                                <tr><td colSpan={9} className="p-12 text-center text-slate-400 font-medium">Tidak ada data alat ditemukan dengan filter saat ini.</td></tr>
                            ) : (
                                filteredAlat.map((item) => {
                                    const rentedCount = calculateRentedCountForTool(item, sewa)
                                    const status = getToolStatus(item, rentedCount, sewa)
                                    return (
                                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-4">
                                                {item.gambar ? (
                                                    <div className="relative group w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                                        <Image
                                                            src={item.gambar}
                                                            alt={item.nama}
                                                            width={48}
                                                            height={48}
                                                            className="w-full h-full object-cover cursor-pointer"
                                                            onClick={() => setViewImage({ src: item.gambar as string, name: item.nama })}
                                                            referrerPolicy="no-referrer"
                                                            unoptimized
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                            <Eye size={14} className="text-white" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                                                        <Package size={18} className="text-slate-400" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 font-semibold text-slate-900 max-w-[220px] truncate" title={item.nama}>{item.nama}</td>
                                            <td className="p-4">
                                                <span className="text-xs bg-white text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">{item.kategori}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${kondisiStyles[item.kondisi] || 'bg-slate-100 text-slate-600'}`}>
                                                    {KONDISI_LABEL[item.kondisi] || item.kondisi}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${statusStyles[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">{item.jumlah || 1}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md ${rentedCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-400'}`}>
                                                    {rentedCount} unit
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-slate-500 max-w-[200px]">
                                                <div className="truncate" title={item.keterangan || ''}>{item.keterangan || '-'}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-blue-600 hover:bg-blue-50" tooltip="Edit Alat" onClick={() => openEditForm(item)}>
                                                        <Edit2 size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:bg-rose-50" tooltip="Hapus" onClick={() => handleDelete(item)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Form Modal (Add/Edit) */}
            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingId ? 'Ubah Detail Alat' : 'Tambah Alat Multimedia Baru'}
                description="Kelola detail spesifikasi alat, kondisi, jumlah, dan gambar."
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-5 py-2">
                    <Input label="Nama Alat" required placeholder="Contoh: Kamera Sony ILCE-6400" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kategori</label>
                            <input
                                type="text"
                                list="kategori-list"
                                value={form.kategori}
                                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                                placeholder="Ketik atau pilih kategori"
                            />
                            <datalist id="kategori-list">
                                {categories.map((c) => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                        <Select
                            label="Kondisi"
                            value={form.kondisi}
                            onChange={(e) => setForm({ ...form, kondisi: e.target.value as KondisiAlat })}
                            options={kondisiOptions.map((k) => ({ value: k.value, label: `${k.label}` }))}
                        />
                        <Input label="Jumlah Alat" type="number" min={1} required value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: Math.max(1, parseInt(e.target.value) || 1) })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Serial Number" placeholder="Contoh: SN-8374829" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
                        <Input label="Lokasi Penyimpanan" placeholder="Contoh: Gudang 1, Rak A" value={form.lokasi_penyimpanan} onChange={(e) => setForm({ ...form, lokasi_penyimpanan: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan Alat</label>
                        <textarea
                            rows={3}
                            placeholder="Contoh: No Seri 8374829, kelengkapan tas, charger, baterai cadangan..."
                            value={form.keterangan}
                            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 resize-none"
                        />
                    </div>

                    {/* Gambar */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Gambar Alat</label>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {IMAGE_PRESETS.map((preset) => (
                                <button
                                    type="button"
                                    key={preset.key}
                                    onClick={() => { setForm({ ...form, gambar: preset.url }); setCustomImageBase64('') }}
                                    className={`relative w-12 h-12 rounded-lg overflow-hidden border shrink-0 transition-all ${
                                        form.gambar === preset.url && !customImageBase64 ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-200 opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={preset.url} alt={preset.key} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('alat-image-input')?.click()}
                            >
                                <ImageIcon size={14} /> {customImageBase64 ? 'Ganti Gambar Upload' : 'Upload Gambar Sendiri'}
                            </Button>
                            <input
                                id="alat-image-input"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => { if (e.target.files?.[0]) processImageFile(e.target.files[0]) }}
                            />
                            {form.gambar && (
                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={form.gambar} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                            {customImageBase64 && (
                                <button
                                    type="button"
                                    onClick={() => { setCustomImageBase64(''); setForm({ ...form, gambar: IMAGE_PRESETS[0].url }) }}
                                    className="text-xs text-rose-500 font-semibold hover:underline inline-flex items-center gap-1"
                                >
                                    <X size={12} /> Reset ke preset
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
                        <Button type="submit" isLoading={submitting} className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl">
                            {editingId ? 'Simpan Perubahan' : 'Simpan Alat'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Import Preview Modal */}
            <Modal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                title="Pratinjau Impor Data Alat"
                description="Edit terlebih dahulu jika perlu, lalu konfirmasi untuk memasukkan data ke database."
                size="xl"
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-2.5">
                            <FileSpreadsheet size={20} className="text-emerald-500" />
                            <div>
                                <p className="text-xs font-bold text-emerald-900">Sumber File: {importFileName}</p>
                                <p className="text-[11px] text-emerald-700">Terdeteksi <strong>{parsedImportItems.length} alat</strong> siap dimasukkan.</p>
                            </div>
                        </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider">
                                    <th className="p-3">#</th>
                                    <th className="p-3">Nama Alat</th>
                                    <th className="p-3">Kategori</th>
                                    <th className="p-3">Kondisi</th>
                                    <th className="p-3 text-center">Jumlah</th>
                                    <th className="p-3">Keterangan</th>
                                    <th className="p-3 text-center">Hapus</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {parsedImportItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                                        <td className="p-3 font-semibold text-slate-900">
                                            <input
                                                type="text"
                                                value={item.nama}
                                                onChange={(e) => {
                                                    const val = e.target.value
                                                    setParsedImportItems((prev) => prev.map((it, i) => i === idx ? { ...it, nama: val } : it))
                                                }}
                                                className="w-full bg-transparent border-b border-slate-200 focus:border-blue-400 focus:outline-none text-xs font-semibold"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="text"
                                                value={item.kategori}
                                                onChange={(e) => {
                                                    const val = e.target.value
                                                    setParsedImportItems((prev) => prev.map((it, i) => i === idx ? { ...it, kategori: val } : it))
                                                }}
                                                className="w-full bg-transparent border-b border-slate-200 focus:border-blue-400 focus:outline-none text-xs text-blue-600"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <select
                                                value={item.kondisi}
                                                onChange={(e) => {
                                                    const val = e.target.value
                                                    setParsedImportItems((prev) => prev.map((it, i) => i === idx ? { ...it, kondisi: val } : it))
                                                }}
                                                className="bg-white text-slate-900 text-xs p-1.5 rounded border border-slate-200 focus:outline-none"
                                            >
                                                {Object.values(KONDISI_LABEL).map((label) => (
                                                    <option key={label} value={label}>{label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-3 text-center">
                                            <input
                                                type="number"
                                                min={1}
                                                value={item.jumlah}
                                                onChange={(e) => {
                                                    const val = Math.max(1, parseInt(e.target.value) || 1)
                                                    setParsedImportItems((prev) => prev.map((it, i) => i === idx ? { ...it, jumlah: val } : it))
                                                }}
                                                className="bg-transparent border-b border-slate-200 focus:border-blue-400 focus:outline-none w-12 text-center font-mono text-emerald-600"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="text"
                                                value={item.keterangan}
                                                onChange={(e) => {
                                                    const val = e.target.value
                                                    setParsedImportItems((prev) => prev.map((it, i) => i === idx ? { ...it, keterangan: val } : it))
                                                }}
                                                className="w-full bg-transparent border-b border-slate-200 focus:border-blue-400 focus:outline-none text-xs text-slate-600"
                                            />
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => setParsedImportItems((prev) => prev.filter((_, i) => i !== idx))}
                                                className="p-1 rounded text-rose-500 hover:bg-rose-50"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500">Tips: Anda dapat mengedit data sebelum mengimpor.</span>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsImportOpen(false)}>Batal</Button>
                            <Button onClick={handleConfirmImport} isLoading={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                                Konfirmasi Impor ({parsedImportItems.length} Alat)
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Image preview modal */}
            {viewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-2xl p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={viewImage.src} alt={viewImage.name} className="w-full max-h-[60vh] object-contain rounded-xl" />
                        <p className="text-sm font-bold text-slate-800 mt-3 text-center">{viewImage.name}</p>
                        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setViewImage(null)}>Tutup</Button>
                    </div>
                </div>
            )}
        </div>
    )
}
