'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
    Plus, 
    Search, 
    Box, 
    Camera, 
    Mic, 
    Lightbulb, 
    Monitor, 
    Gamepad2, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    ArrowUpRight,
    Filter,
    History
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function InventarisPage() {
    const { user } = useAuthStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedKategori, setSelectedKategori] = useState('Semua')

    // Fetch Inventory Catalog
    const { data: catalogData, isLoading: isLoadingCatalog, fetchData: fetchCatalog } = useApi('/inventaris', { immediate: false })
    // Fetch user's active borrows
    const { data: borrowData, isLoading: isLoadingBorrows, fetchData: fetchBorrows } = useApi(`/inventaris/pinjam?user_id=${user?.id}`, { immediate: false })

    useEffect(() => {
        if (user) {
            fetchCatalog()
            fetchBorrows()
        }
    }, [user])

    const catalog = catalogData?.data || []
    const borrows = borrowData?.data || []

    // Filter Logic
    const filteredCatalog = catalog.filter((item: any) => {
        const matchesSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesKategori = selectedKategori === 'Semua' || item.kategori === selectedKategori
        return matchesSearch && matchesKategori
    })

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedAlat, setSelectedAlat] = useState<any>(null)
    const [keperluan, setKeperluan] = useState('')
    const [estimasiKembali, setEstimasiKembali] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handlePinjam = (alat: any) => {
        if (!alat.is_available) return
        setSelectedAlat(alat)
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        if (!selectedAlat) return
        setSubmitting(true)
        try {
            await apiFetch('/inventaris/pinjam', {
                method: 'POST',
                body: JSON.stringify({
                    alat_id: selectedAlat.id,
                    estimasi_kembali: estimasiKembali ? new Date(estimasiKembali).toISOString() : new Date().toISOString()
                })
            })
            setIsModalOpen(false)
            setKeperluan('')
            setEstimasiKembali('')
            fetchCatalog()
            fetchBorrows()
        } catch (err) {
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }

    const getKategoriIcon = (kat: string) => {
        switch (kat?.toLowerCase()) {
            case 'kamera': return <Camera size={20} />
            case 'audio': return <Mic size={20} />
            case 'lighting': return <Lightbulb size={20} />
            case 'monitor': return <Monitor size={20} />
            case 'aksesoris': return <Gamepad2 size={20} />
            default: return <Box size={20} />
        }
    }

    const KATEGORI_LIST = ['Semua', 'Kamera', 'Audio', 'Lighting', 'Monitor', 'Aksesoris']

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-[40px] bg-slate-900 p-8 lg:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] -mr-32 -mt-32 rounded-full"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-2 uppercase">Inventaris Media</h1>
                        <p className="text-blue-400 font-bold uppercase tracking-widest text-sm italic">Pusat Peminjaman Alat Multimedia Pesantren</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="glass-panel px-8 py-5 rounded-3xl border-white/10 flex flex-col items-center">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Unit Siap Pakai</span>
                            <span className="text-3xl font-black">{catalog.filter((i: any) => i.is_available).length}</span>
                        </div>
                        <div className="glass-panel px-8 py-5 rounded-3xl border-white/10 flex flex-col items-center">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Sedang Keluar</span>
                            <span className="text-3xl font-black">{borrows.filter((i: any) => i.status === 'approved').length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Cari seri kamera, merk lensa, atau nama alat..."
                        className="w-full h-16 pl-16 pr-6 rounded-3xl bg-white border-2 border-slate-100 focus:border-blue-500 outline-none font-bold text-slate-800 transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {KATEGORI_LIST.map((kat) => (
                        <button
                            key={kat}
                            onClick={() => setSelectedKategori(kat)}
                            className={`h-16 px-8 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${
                                selectedKategori === kat 
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                                : 'bg-white text-slate-500 border-2 border-slate-100 hover:border-blue-200'
                            }`}
                        >
                            {kat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {isLoadingCatalog ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-[380px] rounded-[40px] bg-white animate-pulse border-2 border-slate-50"></div>
                    ))
                ) : filteredCatalog.length > 0 ? (
                    filteredCatalog.map((item: any) => (
                        <div 
                            key={item.id} 
                            onClick={() => handlePinjam(item)}
                            className={`group glass-panel rounded-[40px] overflow-hidden transition-all duration-500 border-2 ${
                                item.is_available 
                                ? 'hover:-translate-y-3 hover:border-blue-500 cursor-pointer border-white shadow-xl shadow-slate-200/50' 
                                : 'opacity-70 grayscale border-slate-100 cursor-not-allowed'
                            }`}
                        >
                            <div className="p-8 pb-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl ${item.is_available ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {getKategoriIcon(item.kategori)}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${
                                        item.is_available 
                                        ? 'bg-blue-100/50 text-blue-700 border-blue-200' 
                                        : 'bg-rose-100/50 text-rose-700 border-rose-200'
                                    }`}>
                                        {item.is_available ? 'Tersedia' : 'Dipakai'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight line-clamp-2">
                                    {item.nama}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{item.kategori || 'Umum'}</p>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">SN: {item.serial_number || 'Unit-Internal'}</p>
                                
                                <div className="h-[1px] w-full bg-slate-100 mb-6"></div>
                                
                                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">Kondisi Alat</span>
                                    <span className="text-blue-500">{item.kondisi || 'Baik'}</span>
                                </div>
                            </div>
                            <div className={`h-14 flex items-center justify-center font-black text-[10px] uppercase tracking-[0.3em] transition-all ${
                                item.is_available 
                                ? 'bg-blue-600 text-white group-hover:bg-slate-900' 
                                : 'bg-slate-200 text-slate-400'
                            }`}>
                                {item.is_available ? 'Ajukan Peminjaman' : 'Alat Tidak Tersedia'}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-32 text-center glass-panel rounded-[50px] border-dashed border-4 border-slate-100">
                         <Box className="w-20 h-20 mx-auto mb-6 text-slate-200" />
                         <p className="text-2xl font-black text-slate-300 uppercase tracking-widest">Alat Tidak Ditemukan</p>
                    </div>
                )}
            </div>

            {/* My Active Borrows Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 px-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Status Pinjaman Anda</h2>
                    <div className="h-[2px] flex-1 bg-slate-100"></div>
                </div>

                {isLoadingBorrows ? (
                    <div className="h-40 rounded-[40px] bg-slate-100 animate-pulse"></div>
                ) : borrows.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {borrows.map((b: any) => (
                            <div key={b.id} className="glass-panel p-8 rounded-[40px] border-blue-100 bg-blue-50/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 translate-x-4 -translate-y-4 opacity-10 text-blue-600 group-hover:scale-125 transition-transform duration-700">
                                    <Clock size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                                            {getKategoriIcon(b.alat?.kategori)}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-900 uppercase tracking-tight">{b.alat?.nama}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${
                                                    b.status === 'approved' ? 'bg-blue-500 text-white border-none' : 
                                                    b.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-500 text-white border-none'
                                                }`}>
                                                    {b.status === 'approved' ? 'Sedang Dipinjam' : 
                                                     b.status === 'pending' ? 'Tunggu Validasi' : b.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest border-b border-blue-100/50 pb-2">
                                            <span className="text-slate-400">Waktu Ambil</span>
                                            <span className="text-slate-700">{format(new Date(b.created_at), 'dd MMM (HH:mm)', { locale: id })}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">Wajib Kembali</span>
                                            <span className="text-rose-500">{format(new Date(b.estimasi_kembali), 'dd MMM (HH:mm)', { locale: id })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center glass-panel rounded-[50px] bg-slate-50/50 border-2 border-dashed border-slate-200">
                        <History className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Anda tidak sedang meminjam alat apapun.</p>
                    </div>
                )}
            </div>

            {/* Modal Pinjam */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedAlat(null); }}
                title="Formulir Peminjaman Alat"
                description="Harap isi detail penggunaan unit multimedia dengan bertanggung jawab."
            >
                <div className="space-y-6 pt-4">
                    {selectedAlat && (
                         <div className="p-6 rounded-[30px] bg-blue-50 border border-blue-100 flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                                {getKategoriIcon(selectedAlat.kategori)}
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{selectedAlat.nama}</h4>
                                <p className="text-xs text-blue-700 font-bold uppercase tracking-widest mt-1">Siap Produksi</p>
                            </div>
                         </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Project (Opsional)</label>
                        <textarea
                            className="w-full min-h-[120px] p-5 rounded-[25px] bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none font-medium text-sm transition-all shadow-inner"
                            placeholder="Sebutkan detail project atau alasan peminjaman..."
                            value={keperluan}
                            onChange={(e) => setKeperluan(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Batas Waktu Pengembalian</label>
                        <div className="relative">
                            <input
                                type="datetime-local"
                                className="w-full h-14 p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none font-bold text-sm transition-all shadow-inner px-6"
                                value={estimasiKembali}
                                onChange={(e) => setEstimasiKembali(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <Button 
                            variant="outline" 
                            className="flex-1 h-14 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px]"
                            onClick={() => { setIsModalOpen(false); setSelectedAlat(null); }}
                        >
                            Batalkan
                        </Button>
                        <Button 
                            className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-blue-500/20"
                            onClick={handleSubmit}
                            isLoading={submitting}
                            disabled={!estimasiKembali}
                        >
                            Kirim Permohonan
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>{children}</span>
}