'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApi, invalidateCache } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import {
    Alat, Sewa, HargaSewaItem, StatusSewa, KategoriSewa, JenisSewa, ReturnStatus,
    mapAlatFromApi, mapHargaFromApi, mapSewaFromApi, mapSewaToApi,
} from '@/features/staff-alat/lib/staffAlatTypes'
import { formatRupiah, daysBetween, getErrorMessage } from '@/features/staff-alat/lib/staffAlatUtils'
import {
    ArrowUpDown, Search, Plus, Download, Filter, DollarSign, Tag,
    Trash2, Edit2, HelpCircle, Package,
} from 'lucide-react'
import Image from 'next/image'

type SortField = 'namaPenyewa' | 'kategori' | 'tanggalPenyewaan' | 'tanggalPengembalian' | 'hargaSewa' | 'status'
type SortOrder = 'asc' | 'desc'

interface FormState {
    namaPenyewa: string
    jenis: JenisSewa
    kategori: KategoriSewa
    tanggalPenyewaan: string
    tanggalPengembalian: string
    catatan: string
    jaminan: string
    selectedIds: string[]
    quantities: Record<string, number>
    hargaManual: number | null
    status: StatusSewa
    statusPengembalian: ReturnStatus
}

function today() {
    return new Date().toISOString().split('T')[0]
}

function plusDays(days: number) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
}

function emptyForm(): FormState {
    return {
        namaPenyewa: '',
        jenis: 'Penyewaan',
        kategori: 'Umum',
        tanggalPenyewaan: today(),
        tanggalPengembalian: plusDays(3),
        catatan: '',
        jaminan: '',
        selectedIds: [],
        quantities: {},
        hargaManual: null,
        status: 'Belum Lunas',
        statusPengembalian: 'Belum Mengembalikan',
    }
}

export default function SewaTab() {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterKategori, setFilterKategori] = useState('Semua')
    const [filterStatus, setFilterStatus] = useState('Semua')
    const [sortField, setSortField] = useState<SortField>('tanggalPenyewaan')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<FormState>(emptyForm())
    const [formSearch, setFormSearch] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [isPriceListOpen, setIsPriceListOpen] = useState(false)

    const { data: sewaRes, isLoading: isLoadingSewa, fetchData: fetchSewa } = useApi('/staff-alat/sewa?limit=100', { immediate: false })
    const { data: alatRes, isLoading: isLoadingAlat, fetchData: fetchAlat } = useApi('/inventaris?limit=100', { immediate: false })
    const { data: hargaRes, isLoading: isLoadingHarga, fetchData: fetchHarga } = useApi('/staff-alat/harga-sewa?limit=100', { immediate: false })

    const sewa: Sewa[] = useMemo(() => (sewaRes?.data || []).map(mapSewaFromApi), [sewaRes])
    const alat: Alat[] = useMemo(() => (alatRes?.data || []).map(mapAlatFromApi), [alatRes])
    const hargaSewaList: HargaSewaItem[] = useMemo(() => (hargaRes?.data || []).map(mapHargaFromApi), [hargaRes])

    const isLoading = isLoadingSewa || isLoadingAlat || isLoadingHarga

    useEffect(() => {
        fetchSewa()
        fetchAlat()
        fetchHarga()
    }, [fetchSewa, fetchAlat, fetchHarga])

    const handleRefresh = async () => {
        invalidateCache('/staff-alat/sewa?limit=100')
        invalidateCache('/inventaris?limit=100')
        invalidateCache('/staff-alat/harga-sewa?limit=100')
        await fetchSewa()
        await fetchAlat()
        await fetchHarga()
    }

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('asc')
        }
    }

    const filteredSewa = useMemo(() => {
        return [...sewa]
            .filter((item) => {
                const matchSearch = item.namaPenyewa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (item.catatan || '').toLowerCase().includes(searchTerm.toLowerCase())
                const matchKategori = filterKategori === 'Semua' || item.kategori === filterKategori
                const matchStatus = filterStatus === 'Semua' || item.status === filterStatus
                return matchSearch && matchKategori && matchStatus
            })
            .sort((a, b) => {
                const aReturned = a.statusPengembalian === 'Sudah Mengembalikan'
                const bReturned = b.statusPengembalian === 'Sudah Mengembalikan'
                if (aReturned && !bReturned) return 1
                if (!aReturned && bReturned) return -1
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
    }, [sewa, searchTerm, filterKategori, filterStatus, sortField, sortOrder])

    const calculatedPrice = useMemo(() => {
        if (form.jenis === 'Peminjaman') return 0
        return form.selectedIds.reduce((total, id) => {
            const qty = form.quantities[id] || 1
            const selectedAlat = alat.find((a) => a.id === id)
            if (!selectedAlat) return total
            const priceItem = hargaSewaList.find(
                (p) => (p.alatId && p.alatId === id) ||
                    (p.namaAlat.toLowerCase() === selectedAlat.nama.toLowerCase() && p.kategori === form.kategori)
            ) || hargaSewaList.find((p) => p.namaAlat.toLowerCase() === selectedAlat.nama.toLowerCase())
            return total + ((priceItem ? priceItem.harga : 0) * qty)
        }, 0)
    }, [form.jenis, form.selectedIds, form.quantities, form.kategori, alat, hargaSewaList])

    const finalPrice = form.jenis === 'Peminjaman' ? 0 : (form.hargaManual !== null ? form.hargaManual : calculatedPrice)

    useEffect(() => {
        setForm((prev) => ({ ...prev, hargaManual: null }))
    }, [form.selectedIds, form.kategori, form.jenis])

    const toggleAlat = (id: string) => {
        setForm((prev) => {
            const exists = prev.selectedIds.includes(id)
            const nextIds = exists ? prev.selectedIds.filter((x) => x !== id) : [...prev.selectedIds, id]
            const nextQty = { ...prev.quantities }
            if (!exists && !nextQty[id]) {
                const matchedTool = alat.find((a) => a.id === id)
                const priceItem = hargaSewaList.find(
                    (p) => (p.alatId && p.alatId === id) ||
                        (matchedTool && p.namaAlat.toLowerCase() === matchedTool.nama.toLowerCase() && p.kategori === prev.kategori)
                ) || hargaSewaList.find((p) => matchedTool && p.namaAlat.toLowerCase() === matchedTool.nama.toLowerCase())
                nextQty[id] = priceItem?.jumlah || 1
            }
            return { ...prev, selectedIds: nextIds, quantities: nextQty }
        })
    }

    const openAddForm = () => {
        setEditingId(null)
        setForm(emptyForm())
        setFormSearch('')
        setIsFormOpen(true)
    }

    const openEditForm = (item: Sewa) => {
        setEditingId(item.id)
        const quantities: Record<string, number> = {}
        item.items.forEach((i) => {
            if (i.alatId) quantities[i.alatId] = i.jumlah
        })
        setForm({
            namaPenyewa: item.namaPenyewa,
            jenis: item.jenis,
            kategori: item.kategori,
            tanggalPenyewaan: item.tanggalPenyewaan,
            tanggalPengembalian: item.tanggalPengembalian,
            catatan: item.catatan || '',
            jaminan: item.jaminan || '',
            selectedIds: item.items.map((i) => i.alatId).filter((x): x is string => !!x),
            quantities,
            hargaManual: item.hargaSewa,
            status: item.status,
            statusPengembalian: item.statusPengembalian,
        })
        setFormSearch('')
        setIsFormOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.namaPenyewa.trim()) {
            alert('Nama penyewa harus diisi!')
            return
        }
        if (form.selectedIds.length === 0) {
            alert('Pilih minimal satu alat multimedia!')
            return
        }
        setSubmitting(true)
        try {
            const payload = mapSewaToApi({
                namaPenyewa: form.namaPenyewa,
                jenis: form.jenis,
                kategori: form.kategori,
                tanggalPenyewaan: form.tanggalPenyewaan,
                tanggalPengembalian: form.tanggalPengembalian,
                hargaSewa: finalPrice,
                status: form.status,
                statusPengembalian: form.statusPengembalian,
                catatan: form.catatan,
                jaminan: form.jaminan,
                items: form.selectedIds.map((id) => ({
                    alatId: id,
                    jumlah: form.quantities[id] || 1,
                })),
            })
            if (editingId) {
                await apiFetch(`/staff-alat/sewa/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
            } else {
                await apiFetch('/staff-alat/sewa', { method: 'POST', body: JSON.stringify(payload) })
            }
            setIsFormOpen(false)
            await handleRefresh()
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Gagal menyimpan transaksi'))
        } finally {
            setSubmitting(false)
        }
    }

    const handleStatusChange = async (id: string, status: StatusSewa) => {
        try {
            await apiFetch(`/staff-alat/sewa/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
            await handleRefresh()
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Gagal mengubah status'))
        }
    }

    const handleReturnChange = async (id: string, statusPengembalian: ReturnStatus) => {
        try {
            await apiFetch(`/staff-alat/sewa/${id}/return`, { method: 'PATCH', body: JSON.stringify({ status_pengembalian: statusPengembalian }) })
            await handleRefresh()
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Gagal mengubah status pengembalian'))
        }
    }

    const handleDelete = async (id: string, nama: string) => {
        if (!confirm(`Hapus transaksi atas nama "${nama}"?`)) return
        try {
            await apiFetch(`/staff-alat/sewa/${id}`, { method: 'DELETE' })
            await handleRefresh()
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Gagal menghapus transaksi'))
        }
    }

    const keteranganStyles: Record<string, string> = {
        'Lunas': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Belum Lunas': 'bg-yellow-100 text-yellow-700 border-yellow-200',
        'Terlambat': 'bg-rose-100 text-rose-700 border-rose-200',
    }

    const filteredFormAlat = alat.filter(
        (item) => item.nama.toLowerCase().includes(formSearch.toLowerCase()) ||
            item.kategori.toLowerCase().includes(formSearch.toLowerCase())
    )

    const todayStr = today()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Transaksi Alat Multimedia</h2>
                    <p className="text-slate-500 font-medium text-sm mt-0.5">Kelola transaksi penyewaan, peminjaman, tanggal pengembalian, dan status pembayaran.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => setIsPriceListOpen(true)} tooltip="Lihat daftar standar harga sewa">
                        <Tag size={16} className="text-amber-500" /> Daftar Harga Sewa
                    </Button>
                    <Button variant="outline" onClick={async () => {
                        const { downloadSewaExcel } = await import('@/features/staff-alat/lib/excelService')
                        downloadSewaExcel(filteredSewa)
                    }} tooltip="Ekspor transaksi ke Excel">
                        <Download size={16} className="text-emerald-500" /> Ekspor Excel
                    </Button>
                    <Button onClick={openAddForm} className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl">
                        <Plus size={16} /> Tambah Transaksi
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
                            placeholder="Cari nama penyewa atau catatan..."
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
                            options={[
                                { value: 'Semua', label: 'Semua Kategori Sewa' },
                                { value: 'Umum', label: 'Umum' },
                                { value: 'Paket Santri', label: 'Paket Santri' },
                            ]}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <HelpCircle size={16} className="text-slate-400 shrink-0" />
                        <Select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            options={[
                                { value: 'Semua', label: 'Semua Status' },
                                { value: 'Lunas', label: 'Lunas' },
                                { value: 'Belum Lunas', label: 'Belum Lunas' },
                                { value: 'Terlambat', label: 'Terlambat' },
                            ]}
                        />
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card className="overflow-hidden rounded-2xl">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-black uppercase tracking-wider text-slate-500">
                                <th className="p-4">No</th>
                                <th onClick={() => handleSort('namaPenyewa')} className="p-4 cursor-pointer hover:bg-slate-100">
                                    <span className="inline-flex items-center gap-1">Nama Penyewa <ArrowUpDown size={12} /></span>
                                </th>
                                <th className="p-4 max-w-[280px]">Barang Disewa</th>
                                <th onClick={() => handleSort('kategori')} className="p-4 cursor-pointer hover:bg-slate-100">
                                    <span className="inline-flex items-center gap-1">Kategori <ArrowUpDown size={12} /></span>
                                </th>
                                <th onClick={() => handleSort('tanggalPenyewaan')} className="p-4 cursor-pointer hover:bg-slate-100">
                                    <span className="inline-flex items-center gap-1">Tgl Sewa <ArrowUpDown size={12} /></span>
                                </th>
                                <th onClick={() => handleSort('tanggalPengembalian')} className="p-4 cursor-pointer hover:bg-slate-100">
                                    <span className="inline-flex items-center gap-1">Tgl Kembali <ArrowUpDown size={12} /></span>
                                </th>
                                <th onClick={() => handleSort('hargaSewa')} className="p-4 cursor-pointer hover:bg-slate-100">
                                    <span className="inline-flex items-center gap-1">Harga Sewa <ArrowUpDown size={12} /></span>
                                </th>
                                <th onClick={() => handleSort('status')} className="p-4 cursor-pointer hover:bg-slate-100">
                                    <span className="inline-flex items-center gap-1">Status <ArrowUpDown size={12} /></span>
                                </th>
                                <th className="p-4">Pengembalian</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {isLoading && sewa.length === 0 ? (
                                <tr><td colSpan={10} className="p-12 text-center text-slate-400">Memuat data...</td></tr>
                            ) : filteredSewa.length === 0 ? (
                                <tr><td colSpan={10} className="p-12 text-center text-slate-400 font-medium">Tidak ada transaksi sewa ditemukan.</td></tr>
                            ) : (
                                filteredSewa.map((item, index) => {
                                    const daysLeft = daysBetween(todayStr, item.tanggalPengembalian)
                                    const isOverdue = daysLeft < 0 && item.statusPengembalian === 'Belum Mengembalikan'
                                    return (
                                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-4 font-mono text-xs text-slate-400">{index + 1}</td>
                                            <td className="p-4 font-semibold text-slate-900">
                                                {item.namaPenyewa}
                                                {item.catatan && (
                                                    <span className="block text-[10px] font-normal text-slate-400 truncate max-w-[160px]">{item.catatan}</span>
                                                )}
                                            </td>
                                            <td className="p-4 max-w-[280px]">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(item.items || []).map((i, tIdx) => (
                                                        <span key={`${i.id}-${tIdx}`} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-700">
                                                            {i.alat?.gambar ? (
                                                                <Image src={i.alat.gambar} alt={i.namaAlat || ''} width={14} height={14} className="w-3.5 h-3.5 rounded-sm object-cover shrink-0" referrerPolicy="no-referrer" unoptimized />
                                                            ) : null}
                                                            <span className="truncate max-w-[130px]" title={i.namaAlat || undefined}>{i.namaAlat || '(alat terhapus)'}</span>
                                                            <span className="px-1 bg-indigo-100 text-indigo-600 font-bold rounded text-[9px]">x{i.jumlah}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {item.jenis === 'Peminjaman' ? (
                                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-black uppercase">Peminjaman</Badge>
                                                ) : (
                                                    <Badge className={`font-black uppercase ${item.kategori === 'Paket Santri' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                                        Sewa ({item.kategori})
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-4 font-mono text-xs text-slate-600">{item.tanggalPenyewaan}</td>
                                            <td className="p-4 font-mono text-xs">
                                                <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>{item.tanggalPengembalian}</span>
                                            </td>
                                            <td className="p-4 font-mono text-xs font-bold text-slate-900">
                                                {item.jenis === 'Peminjaman' ? <span className="text-emerald-500">Gratis</span> : formatRupiah(item.hargaSewa)}
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    value={item.status}
                                                    onChange={(e) => handleStatusChange(item.id, e.target.value as StatusSewa)}
                                                    className={`text-xs font-bold px-2 py-1 rounded-full cursor-pointer border focus:outline-none ${keteranganStyles[item.status] || 'bg-slate-100 text-slate-600'}`}
                                                >
                                                    <option value="Belum Lunas">Belum Lunas</option>
                                                    <option value="Lunas">Lunas</option>
                                                    <option value="Terlambat">Terlambat</option>
                                                </select>
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    value={item.statusPengembalian}
                                                    onChange={(e) => handleReturnChange(item.id, e.target.value as ReturnStatus)}
                                                    className={`text-xs font-bold px-2 py-1 rounded-full cursor-pointer border focus:outline-none ${
                                                        item.statusPengembalian === 'Sudah Mengembalikan'
                                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                            : 'bg-amber-100 text-amber-700 border-amber-200'
                                                    }`}
                                                >
                                                    <option value="Belum Mengembalikan">Belum Mengembalikan</option>
                                                    <option value="Sudah Mengembalikan">Sudah Mengembalikan</option>
                                                </select>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-blue-600 hover:bg-blue-50" tooltip="Ubah Transaksi" onClick={() => openEditForm(item)}>
                                                        <Edit2 size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:bg-rose-50" tooltip="Hapus" onClick={() => handleDelete(item.id, item.namaPenyewa)}>
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

            {/* Price List Modal */}
            <Modal isOpen={isPriceListOpen} onClose={() => setIsPriceListOpen(false)} title="Daftar Standar Harga Sewa Alat" size="lg">
                <div className="space-y-4">
                    <p className="text-xs text-slate-500">
                        Tarif ini disinkronkan dari menu <strong>Tarif Harga</strong>. Sistem otomatis memakainya untuk menaksir total sewa baru.
                    </p>
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 font-black uppercase tracking-wider text-slate-500">
                                    <th className="p-3">Nama Alat</th>
                                    <th className="p-3">Kategori</th>
                                    <th className="p-3 text-right">Harga / Hari</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {hargaSewaList.length === 0 && (
                                    <tr><td colSpan={3} className="p-8 text-center text-slate-400">Belum ada tarif. Tambahkan di menu Tarif Harga.</td></tr>
                                )}
                                {hargaSewaList.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">{p.namaAlat}</td>
                                        <td className="p-3">
                                            <Badge className={p.kategori === 'Paket Santri' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>
                                                {p.kategori}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-right font-mono text-emerald-600 font-bold">{formatRupiah(p.harga)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => setIsPriceListOpen(false)}>Tutup</Button>
                    </div>
                </div>
            </Modal>

            {/* Add/Edit Form Modal */}
            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingId ? 'Ubah Data Transaksi' : 'Registrasi Transaksi Baru'}
                description="Pilih alat, sistem akan menghitung estimasi tarif otomatis."
                size="xl"
            >
                <form onSubmit={handleSubmit} className="space-y-5 py-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Nama Penerima / Penyewa" required placeholder="Contoh: Panitia Kajian Ahad" value={form.namaPenyewa} onChange={(e) => setForm({ ...form, namaPenyewa: e.target.value })} />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Jenis Transaksi</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, jenis: 'Penyewaan' })}
                                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                                        form.jenis === 'Penyewaan' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    Penyewaan (Berbayar)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, jenis: 'Peminjaman' })}
                                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                                        form.jenis === 'Peminjaman' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    Peminjaman (Gratis)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Mulai" type="date" required value={form.tanggalPenyewaan} onChange={(e) => setForm({ ...form, tanggalPenyewaan: e.target.value })} />
                            <Input label="Kembali" type="date" required value={form.tanggalPengembalian} onChange={(e) => setForm({ ...form, tanggalPengembalian: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Kategori Tarif {form.jenis === 'Peminjaman' && <span className="text-amber-500 text-[10px]">(Khusus Penyewaan)</span>}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    disabled={form.jenis === 'Peminjaman'}
                                    onClick={() => setForm({ ...form, kategori: 'Umum' })}
                                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                                        form.jenis === 'Peminjaman'
                                            ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                            : form.kategori === 'Umum'
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    Umum (Normal)
                                </button>
                                <button
                                    type="button"
                                    disabled={form.jenis === 'Peminjaman'}
                                    onClick={() => setForm({ ...form, kategori: 'Paket Santri' })}
                                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                                        form.jenis === 'Peminjaman'
                                            ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                            : form.kategori === 'Paket Santri'
                                                ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    Paket Santri
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Equipment selector */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-slate-700">
                                Pilih Alat Multimedia <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{form.selectedIds.length} Alat Terpilih</span>
                        </div>
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari alat multimedia..."
                                value={formSearch}
                                onChange={(e) => setFormSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-[200px] overflow-y-auto space-y-2">
                            {filteredFormAlat.length === 0 ? (
                                <div className="text-center py-4 text-xs text-slate-400">Tidak ada data alat yang cocok.</div>
                            ) : (
                                filteredFormAlat.map((a) => {
                                    const isChecked = form.selectedIds.includes(a.id)
                                    const priceItem = hargaSewaList.find(
                                        (p) => (p.alatId && p.alatId === a.id) ||
                                            (p.namaAlat.toLowerCase() === a.nama.toLowerCase() && p.kategori === form.kategori)
                                    ) || hargaSewaList.find((p) => p.namaAlat.toLowerCase() === a.nama.toLowerCase())
                                    return (
                                        <div
                                            key={a.id}
                                            onClick={() => toggleAlat(a.id)}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                                                isChecked ? 'bg-blue-50 border-blue-300' : 'bg-white border-transparent hover:border-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <input type="checkbox" checked={isChecked} readOnly className="rounded text-blue-600 border-slate-300 pointer-events-none" />
                                                {a.gambar ? (
                                                    <Image src={a.gambar} alt={a.nama} width={32} height={32} className="w-8 h-8 rounded object-cover shrink-0" referrerPolicy="no-referrer" unoptimized />
                                                ) : (
                                                    <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center shrink-0"><Package size={14} className="text-slate-400" /></div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{a.nama}</p>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-1.5 rounded">{a.kategori}</span>
                                                        <span className="text-[9px] bg-white text-slate-500 font-semibold px-1.5 rounded border border-slate-200">Stok: {a.jumlah || 1}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {isChecked && (
                                                <div className="flex items-center gap-1.5 ml-auto mr-3 bg-white px-2 py-0.5 rounded-lg border border-slate-200" onClick={(e) => e.stopPropagation()}>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Jumlah:</span>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={form.quantities[a.id] || 1}
                                                        onChange={(e) => {
                                                            const val = Math.max(1, parseInt(e.target.value) || 1)
                                                            setForm((prev) => ({ ...prev, quantities: { ...prev.quantities, [a.id]: val } }))
                                                        }}
                                                        className="w-10 bg-transparent text-center text-xs font-mono font-bold text-blue-600 focus:outline-none"
                                                    />
                                                </div>
                                            )}
                                            {form.jenis === 'Penyewaan' ? (
                                                <span className="text-xs font-mono font-semibold text-emerald-600 shrink-0">
                                                    {formatRupiah(priceItem ? priceItem.harga : 0)}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-mono font-semibold text-slate-400 shrink-0">Gratis (Rp 0)</span>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Pricing summary */}
                    {form.jenis === 'Penyewaan' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Estimasi Tarif Sistem ({form.kategori})</span>
                                <p className="text-xl font-mono font-black text-emerald-600">{formatRupiah(calculatedPrice)}</p>
                                {form.selectedIds.length > 0 ? (
                                    <div className="mt-2 space-y-1 bg-white p-2.5 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                                        {form.selectedIds.map((id) => {
                                            const item = alat.find((a) => a.id === id)
                                            if (!item) return null
                                            const qty = form.quantities[id] || 1
                                            const priceItem = hargaSewaList.find(
                                                (p) => (p.alatId && p.alatId === id) || (p.namaAlat.toLowerCase() === item.nama.toLowerCase() && p.kategori === form.kategori)
                                            )
                                            const unitPrice = priceItem ? priceItem.harga : 0
                                            return (
                                                <div key={id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-none gap-2">
                                                    <span className="truncate max-w-[140px] text-slate-600" title={item.nama}>{item.nama} <span className="text-[10px] opacity-60">({qty}x)</span></span>
                                                    <span className="font-mono text-[11px] shrink-0 text-emerald-600">
                                                        {qty} × {formatRupiah(unitPrice)} = <strong>{formatRupiah(unitPrice * qty)}</strong>
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-slate-400">Pilih alat untuk melihat rincian estimasi tarif.</p>
                                )}
                            </div>
                            <div className="space-y-1.5 flex flex-col justify-start">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                    <DollarSign size={14} /> Harga Final Disepakati (Rp)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder={formatRupiah(calculatedPrice)}
                                    value={form.hargaManual === null ? '' : form.hargaManual}
                                    onChange={(e) => {
                                        const val = e.target.value.trim()
                                        if (val === '') setForm((prev) => ({ ...prev, hargaManual: null }))
                                        else {
                                            const num = Number(val)
                                            setForm((prev) => ({ ...prev, hargaManual: isNaN(num) ? null : Math.max(0, num) }))
                                        }
                                    }}
                                    className="h-10 w-full px-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                                />
                                <span className="text-[10px] text-amber-600">
                                    * Kosongkan untuk otomatis memakai estimasi sistem ({formatRupiah(calculatedPrice)}).
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Status (hanya saat edit) */}
                    {editingId && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select
                                label="Status Pembayaran"
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value as StatusSewa })}
                                options={[
                                    { value: 'Belum Lunas', label: 'Belum Lunas' },
                                    { value: 'Lunas', label: 'Lunas' },
                                    { value: 'Terlambat', label: 'Terlambat' },
                                ]}
                            />
                            <Select
                                label="Status Pengembalian"
                                value={form.statusPengembalian}
                                onChange={(e) => setForm({ ...form, statusPengembalian: e.target.value as ReturnStatus })}
                                options={[
                                    { value: 'Belum Mengembalikan', label: 'Belum Mengembalikan' },
                                    { value: 'Sudah Mengembalikan', label: 'Sudah Mengembalikan' },
                                ]}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Catatan Transaksi (Opsional)" placeholder="Contoh: DP 50%, jaminan kartu identitas santri..." value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} />
                        <Input label="Jaminan (Opsional)" placeholder="Contoh: KTP / Kartu Santri" value={form.jaminan} onChange={(e) => setForm({ ...form, jaminan: e.target.value })} />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
                        <Button type="submit" isLoading={submitting} className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl">
                            {editingId ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
