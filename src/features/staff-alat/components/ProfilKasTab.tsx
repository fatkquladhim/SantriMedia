'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import { useApi, invalidateCache } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
    StaffAlatProfil, Alat, Sewa, HargaSewaItem,
    mapAlatFromApi, mapSewaFromApi, mapHargaFromApi, mapProfilFromApi, mapProfilToApi,
} from '@/features/staff-alat/lib/staffAlatTypes'
import { getErrorMessage, formatRupiah } from '@/features/staff-alat/lib/staffAlatUtils'
import { User, Calendar, Wallet, Upload, FileOutput, RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function ProfilKasTab() {
    const [isEditing, setIsEditing] = useState(false)
    const [formNama, setFormNama] = useState('')
    const [formSejak, setFormSejak] = useState('')
    const [formUang, setFormUang] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [customLogo, setCustomLogo] = useState('')

    const { data: profilRes, isLoading: isLoadingProfil, fetchData: fetchProfil } = useApi('/staff-alat/profil', { immediate: false })
    const { data: alatRes, fetchData: fetchAlat } = useApi('/inventaris?limit=100', { immediate: false })
    const { data: sewaRes, fetchData: fetchSewa } = useApi('/staff-alat/sewa?limit=100', { immediate: false })
    const { data: hargaRes, fetchData: fetchHarga } = useApi('/staff-alat/harga-sewa?limit=100', { immediate: false })

    const profil: StaffAlatProfil | null = useMemo(() => (profilRes?.data ? mapProfilFromApi(profilRes.data) : null), [profilRes])
    const alat: Alat[] = useMemo(() => (alatRes?.data || []).map(mapAlatFromApi), [alatRes])
    const sewa: Sewa[] = useMemo(() => (sewaRes?.data || []).map(mapSewaFromApi), [sewaRes])
    const hargaSewaList: HargaSewaItem[] = useMemo(() => (hargaRes?.data || []).map(mapHargaFromApi), [hargaRes])

    useEffect(() => {
        fetchProfil()
        fetchAlat()
        fetchSewa()
        fetchHarga()
    }, [fetchProfil, fetchAlat, fetchSewa, fetchHarga])

    const handleRefresh = async () => {
        invalidateCache('/staff-alat/profil')
        invalidateCache('/inventaris?limit=100')
        invalidateCache('/staff-alat/sewa?limit=100')
        invalidateCache('/staff-alat/harga-sewa?limit=100')
        await fetchProfil()
        await fetchAlat()
        await fetchSewa()
        await fetchHarga()
    }

    const startEditing = () => {
        setFormNama(profil?.namaStaff || '')
        setFormSejak(profil?.sejak || '')
        setFormUang(profil?.uangAlat || 0)
        setIsEditing(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formNama.trim()) return
        setSubmitting(true)
        try {
            let logoUrl = profil?.logoUrl || null
            if (customLogo) {
                const res = await fetch(customLogo)
                const blob = await res.blob()
                const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : blob.type === 'image/gif' ? 'gif' : 'jpg'
                const file = new File([blob], `logo-upload.${ext}`, { type: blob.type || 'image/jpeg' })
                const formData = new FormData()
                formData.append('file', file)
                const uploadRes = await apiFetch('/upload/alat-image', { method: 'POST', body: formData })
                logoUrl = uploadRes?.data?.url || logoUrl
            }
            await apiFetch('/staff-alat/profil', {
                method: 'PUT',
                body: JSON.stringify(mapProfilToApi({
                    namaStaff: formNama,
                    sejak: formSejak,
                    uangAlat: formUang,
                    logoUrl,
                })),
            })
            setIsEditing(false)
            setCustomLogo('')
            await handleRefresh()
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Gagal menyimpan profil'))
        } finally {
            setSubmitting(false)
        }
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            alert('Hanya file gambar yang diperbolehkan!')
            return
        }
        const reader = new FileReader()
        reader.onload = (ev) => {
            const base64 = ev.target?.result as string
            setCustomLogo(base64)
        }
        reader.readAsDataURL(file)
    }

    const handleAdjustKas = async (amount: number) => {
        if (!confirm(`Sesuaikan saldo kas sebesar ${amount > 0 ? '+' : ''}${formatRupiah(amount)}?`)) return
        try {
            await apiFetch('/staff-alat/profil', {
                method: 'PUT',
                body: JSON.stringify({ uang_alat: Math.max(0, (profil?.uangAlat || 0) + amount) }),
            })
            await handleRefresh()
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Gagal menyesuaikan kas'))
        }
    }

    if (isLoadingProfil && !profil) {
        return <div className="py-20 text-center text-slate-400 font-medium">Memuat profil...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Profil & Kas Uang Alat</h2>
                <p className="text-slate-500 font-medium text-sm mt-0.5">
                    Kelola profil pengurus dan kas keuangan. Saldo kas bertambah otomatis saat transaksi berstatus Lunas.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Staff Profile Card */}
                <Card className="p-6 rounded-2xl lg:col-span-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 p-2 text-[10px] font-black uppercase tracking-wider rounded-bl-xl border-l border-b border-blue-100">
                        Staff Aktif
                    </div>

                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 shadow-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={customLogo || profil?.logoUrl || 'https://images.unsplash.com/photo-1533750349088-cd871a92f311?w=400&auto=format&fit=crop&q=80'}
                                alt="Staff Logo"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                title="Ganti Foto Profil / Logo"
                            >
                                <Upload size={20} className="text-white" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="hidden"
                            />
                        </div>

                        {!isEditing ? (
                            <div className="space-y-1 w-full">
                                <h3 className="text-lg font-black text-slate-900">{profil?.namaStaff}</h3>
                                <p className="text-xs text-blue-600 font-bold flex items-center justify-center gap-1.5">
                                    <Calendar size={14} /> Menjabat Sejak: {profil?.sejak}
                                </p>
                                <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 inline-flex items-center gap-2 w-full justify-center">
                                    <Wallet size={18} className="text-emerald-600 shrink-0" />
                                    <div className="text-left">
                                        <span className="text-[9px] text-emerald-600/60 font-black uppercase block leading-none">Uang Alat Saat Ini</span>
                                        <span className="text-sm font-mono font-black text-emerald-700">{formatRupiah(profil?.uangAlat || 0)}</span>
                                    </div>
                                </div>
                                <Button onClick={startEditing} variant="outline" className="w-full mt-4 rounded-xl">
                                    Edit Profil & Kas
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-4 text-left w-full">
                                <Input label="Nama Staff" required value={formNama} onChange={(e) => setFormNama(e.target.value)} />
                                <Input label="Sejak Kapan Menjabat" required value={formSejak} onChange={(e) => setFormSejak(e.target.value)} />
                                <Input
                                    label="Uang Alat / Saldo (Rp)"
                                    type="number"
                                    min={0}
                                    required
                                    value={formUang}
                                    onChange={(e) => setFormUang(Math.max(0, Number(e.target.value) || 0))}
                                />
                                {customLogo && (
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-black"><CheckCircle2 size={12} /> Logo baru siap disimpan</Badge>
                                        <button type="button" onClick={() => setCustomLogo('')} className="text-xs text-rose-500 font-bold hover:underline">Batal</button>
                                    </div>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsEditing(false)}>Batal</Button>
                                    <Button type="submit" isLoading={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">Simpan</Button>
                                </div>
                            </form>
                        )}
                    </div>
                </Card>

                {/* Right Side */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Kas Card */}
                    <Card className="p-6 rounded-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                            <div>
                                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                                    <ShieldCheck size={20} className="text-emerald-500" /> Saldo Kas Uang Alat
                                </h3>
                                <p className="text-xs text-slate-500">Saldo bertambah otomatis saat status transaksi menjadi Lunas.</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Otomatis
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 md:col-span-2">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Saldo Saat Ini</span>
                                <p className="text-3xl font-mono font-black text-emerald-700">{formatRupiah(profil?.uangAlat || 0)}</p>
                            </div>
                            <div className="space-y-2">
                                <Button variant="outline" className="w-full rounded-xl text-emerald-600 border-emerald-200" onClick={() => handleAdjustKas(10000)}>
                                    <RefreshCw size={14} /> +10.000
                                </Button>
                                <Button variant="outline" className="w-full rounded-xl text-rose-500 border-rose-200" onClick={() => handleAdjustKas(-10000)}>
                                    <RefreshCw size={14} /> -10.000
                                </Button>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-3">
                            * Penyesuaian manual ±10.000 tersedia untuk koreksi. Ubah saldo penuh melalui Edit Profil & Kas.
                        </p>
                    </Card>

                    {/* Backup Card */}
                    <Card className="p-6 rounded-2xl border-emerald-200">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                            <div>
                                <h3 className="font-black text-slate-900 text-base flex items-center gap-2 text-emerald-700">
                                    <FileOutput size={20} className="text-emerald-500" /> Format Excel Backup
                                </h3>
                                <p className="text-xs text-slate-500">Unduh seluruh data (alat, sewa, tarif, profil) dalam satu file Excel (.xlsx).</p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-black">4 Sheet</Badge>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-emerald-700">
                                <div className="p-2 rounded bg-emerald-50 border border-emerald-100 text-center font-bold">1. Data Alat</div>
                                <div className="p-2 rounded bg-emerald-50 border border-emerald-100 text-center font-bold">2. Transaksi Sewa</div>
                                <div className="p-2 rounded bg-emerald-50 border border-emerald-100 text-center font-bold">3. Tarif Harga</div>
                                <div className="p-2 rounded bg-emerald-50 border border-emerald-100 text-center font-bold">4. Profil & Kas</div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <User size={16} className="text-blue-500" />
                                    <span><strong>{profil?.namaStaff}</strong> — Menjabat sejak {profil?.sejak}</span>
                                </div>
                                <Button
                                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                                    onClick={async () => {
                                        const { downloadExcelBackup } = await import('@/features/staff-alat/lib/excelService')
                                        downloadExcelBackup({
                                            alat,
                                            sewa,
                                            hargaSewaList,
                                            profil: profil || {
                                                id: '',
                                                namaStaff: 'Pengurus Mediatech',
                                                sejak: 'Januari 2025',
                                                uangAlat: 0,
                                                logoUrl: null,
                                            },
                                        })
                                    }}
                                >
                                    <FileOutput size={16} /> Unduh File Excel (.xlsx)
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
