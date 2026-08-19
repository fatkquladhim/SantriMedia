// src/app/dashboard/profile/page.tsx
'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { 
    Trophy, Star, Target, CheckCircle2, 
    Zap, Flame, Award, ArrowUpRight, 
    Github, Instagram, Globe, Camera,
    Save, Loader2, AlertCircle, Edit3
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

export default function ProfilePage() {
    const { user, fetchUser } = useAuthStore()
    
    // Fetch data for portfolio & options
    // Guard: only fetch when user.id is a real UUID
    const { data: portfolioData, isLoading: isPortfolioLoading } = useApi(
        user?.id ? `/tasks?assigned_to=${user.id}&status=done` : '',
        { immediate: !!user?.id }
    )
    const { data: divisionsData } = useApi('/divisi')
    const { data: asramaData } = useApi('/asrama')

    const divisiList = Array.isArray(divisionsData) ? divisionsData : (divisionsData?.data || [])
    const asramaList = Array.isArray(asramaData) ? asramaData : (asramaData?.data || [])

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    // Guard: user must exist before any access. formData is initialised safely
    // with optional chaining so we never crash if user is null during hydration.
    const [formData, setFormData] = useState({
        fullName: user?.fullName ?? '',
        bio: user?.bio ?? '',
        divisiId: user?.divisiId ?? '',
        asramaId: user?.asramaId ?? '',
        alamat: user?.alamat ?? '',
        noHp: user?.noHp ?? '',
        avatarUrl: user?.avatarUrl ?? '',
    })

    // Sync form state from store when modal opens
    useEffect(() => {
        if (isEditModalOpen && user) {
            setFormData({
                fullName: user.fullName ?? '',
                bio: user.bio ?? '',
                divisiId: user.divisiId ?? '',
                asramaId: user.asramaId ?? '',
                alamat: user.alamat ?? '',
                noHp: user.noHp ?? '',
                avatarUrl: user.avatarUrl ?? '',
            })
            setSubmitError(null)
        }
    }, [isEditModalOpen, user])

    if (!user) return null

    const xpToNextLevel = 1000
    const currentXP = (user as any).totalPoin || 0
    const progress = (currentXP % xpToNextLevel) / xpToNextLevel * 100
    const currentLevel = Math.floor(currentXP / xpToNextLevel) + 1

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)

        try {
            const res = await apiFetch('/upload/avatar', {
                method: 'POST',
                body: uploadFormData, // apiFetch handles FormData specially if we configure it, or we use native fetch
            })
            const result = res.data || res
            setFormData(prev => ({ ...prev, avatarUrl: result.url }))
            // Optionally update right away
        } catch (err) {
            console.error('Upload failed:', err)
            alert('Gagal mengunggah foto.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            await apiFetch('/users/me', {
                method: 'PATCH',
                body: JSON.stringify({
                    full_name: formData.fullName,
                    bio: formData.bio,
                    divisi_id: formData.divisiId || null,
                    asrama_id: formData.asramaId || null,
                    alamat: formData.alamat || null,
                    no_hp: formData.noHp || null,
                    avatar_url: formData.avatarUrl || null,
                })
            })
            // Refresh session so JWT claim is_profile_complete updates
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            await supabase.auth.refreshSession()
            await fetchUser()
            setIsEditModalOpen(false)
        } catch (err: any) {
            const msg = err?.message || 'Gagal memperbarui profil.'
            setSubmitError(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            
            {/* Warning if profile incomplete — admin tidak perlu melengkapi profil */}
            {!user.isProfileComplete && user.baseRole !== 'admin' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-[30px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/5">
                    <div className="flex items-center gap-4 text-amber-600">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-lg">Profil Belum Lengkap!</h3>
                            <p className="text-sm font-medium opacity-80 uppercase tracking-widest text-[10px]">Mohon lengkapi divisi dan asrama untuk akses penuh fitur ERP.</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-8 h-12 rounded-xl font-black gap-2 shrink-0 shadow-lg shadow-amber-500/10"
                    >
                        Lengkapi Sekarang
                    </Button>
                </div>
            )}

            {/* Hero Profile Section */}
            <div className="relative overflow-hidden rounded-[50px] bg-slate-900 p-8 lg:p-16 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] -mr-48 -mt-48 rounded-full"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
                    {/* Big Avatar with Edit Overlay */}
                    <div className="relative group">
                        <div className="w-44 h-44 rounded-[60px] bg-gradient-to-tr from-blue-500 to-sky-400 p-1 shadow-2xl shadow-blue-500/20 group-hover:rotate-3 transition-transform duration-500">
                            <div className="w-full h-full rounded-[58px] bg-slate-900 overflow-hidden border-4 border-slate-900 relative">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl font-black text-blue-500">
                                        {user.fullName.charAt(0)}
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                                    <Camera size={32} className="text-white mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Update Photo</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                                </label>
                            </div>
                        </div>
                        <div className="absolute -bottom-3 -right-3 w-14 h-14 bg-white text-slate-900 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl ring-4 ring-slate-900">
                            {currentLevel}
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div className="space-y-4">
                            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-2">
                                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
                                    {user.baseRole.replace('_', ' ')}
                                </Badge>
                                {user.divisiNama ? (
                                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
                                        {user.divisiNama}
                                    </Badge>
                                ) : (
                                    <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                        BELUM ADA DIVISI
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tight">{user.fullName}</h1>
                                <button 
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-blue-500 text-white flex items-center justify-center self-center lg:self-auto transition-all"
                                >
                                    <Edit3 size={18} />
                                </button>
                            </div>
                            <p className="text-slate-400 font-medium text-lg max-w-xl">
                                {(user as any).bio || "Belum ada deskripsi singkat untuk profil ini."}
                            </p>
                        </div>

                        <div className="max-w-md space-y-3">
                            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-blue-400">
                                <span>Level Progress</span>
                                <span>{currentXP % xpToNextLevel} / {xpToNextLevel} XP</span>
                            </div>
                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-sky-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 lg:flex-col items-center">
                        <button className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-blue-500 hover:text-white border border-white/10 transition-all flex items-center justify-center"><Instagram size={20}/></button>
                        <button className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-blue-500 hover:text-white border border-white/10 transition-all flex items-center justify-center"><Github size={20}/></button>
                        <button className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-blue-500 hover:text-white border border-white/10 transition-all flex items-center justify-center"><Globe size={20}/></button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Poin', val: (user as any).totalPoin || 0, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Tasks Done', val: portfolioData?.pagination?.total || 0, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Global Rank', val: '#12', icon: Trophy, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                    { label: 'Consistency', val: '98%', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                    <div key={i} className="glass-panel p-8 rounded-[40px] flex flex-col items-center gap-4 text-center hover:-translate-y-2 transition-transform duration-500 border-white">
                        <div className={`p-4 rounded-3xl ${stat.bg} ${stat.color} shadow-inner`}>
                            <stat.icon size={28} />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tight leading-none">{stat.val}</p>
                    </div>
                ))}
            </div>

            {/* Bottom Section */}
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 px-2">Portfolio Work</h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                        {isPortfolioLoading ? (
                            [1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-[38px]" />)
                        ) : portfolioData?.data?.length > 0 ? (
                            portfolioData.data.map((task: any) => (
                                <div key={task.id} className="glass-panel p-6 rounded-[38px] border-white group transition-all">
                                    <div className="aspect-video rounded-[28px] bg-slate-100 mb-4 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl">
                                            <Badge className="bg-blue-100 text-blue-700 border-none font-bold text-[10px]">+{task.poin} XP</Badge>
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors uppercase text-sm tracking-tight">{task.judul}</h4>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{new Date(task.updated_at).toLocaleDateString()}</p>
                                        {task.evidence_url && (
                                            <a 
                                                href={task.evidence_url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-[10px] font-black text-blue-600 flex items-center gap-1 hover:underline"
                                            >
                                                Lihat Karya <ArrowUpRight size={12}/>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 py-20 text-center glass-panel rounded-[40px] border-dashed border-2 border-slate-200">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Belum ada karya yang diselesaikan.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="glass-panel p-10 rounded-[45px] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-3xl -mr-16 -mt-16"></div>
                        <h3 className="text-xl font-bold mb-8 flex items-center gap-3"><Award className="text-amber-500" /> Achievements</h3>
                        <div className="space-y-6">
                            {[
                                { title: 'Early Adopter', date: 'Joined April 2026', icon: Zap, color: 'text-amber-400 bg-amber-400/10' },
                                { title: 'Sharp Shooter', date: '5 Tasks Approved', icon: Target, color: 'text-blue-400 bg-blue-400/10' },
                                { title: 'Consistent Learner', date: '7 Days Streak', icon: Flame, color: 'text-rose-400 bg-rose-400/10' },
                            ].map((badge, i) => (
                                <div key={i} className="flex items-center gap-4 group cursor-default">
                                    <div className={`p-4 rounded-2xl ${badge.color} border border-white/5`}>
                                        <badge.icon size={22} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">{badge.title}</h4>
                                        <p className="text-[10px] font-medium text-slate-400">{badge.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL: Edit Profile */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Personal Profile" size="lg">
                <form onSubmit={handleUpdateProfile} className="space-y-8 py-4">
                    {submitError && (
                        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-800 text-sm flex gap-3">
                            <AlertCircle size={18} className="shrink-0" />
                            {submitError}
                        </div>
                    )}
                    {/* Visual Photo Upload Choice */}
                    <div className="flex flex-col items-center gap-4 pb-4 border-b border-slate-50">
                        <div className="relative group/edit">
                            <div className="w-28 h-28 rounded-3xl bg-slate-100 overflow-hidden border-2 border-blue-500/30">
                                {isUploading ? (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                    </div>
                                ) : formData.avatarUrl ? (
                                    <img src={formData.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-300">
                                        {user.fullName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                                <Camera size={18} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">JPG, PNG, atau WEBP max 2MB</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Input label="Nama Lengkap" value={formData.fullName} onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))} required />
                        <Select
                            label="Divisi Multimedia"
                            value={formData.divisiId}
                            onChange={(e) => setFormData(p => ({ ...p, divisiId: e.target.value }))}
                            options={[{ value: '', label: '-- Pilih Divisi --' }, ...divisiList.map((d: any) => ({ value: d.id, label: d.nama }))]}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Input label="Alamat" value={formData.alamat} onChange={(e) => setFormData(p => ({ ...p, alamat: e.target.value }))} />
                        <Input label="Nomor HP" placeholder="08123456789" value={formData.noHp} onChange={(e) => setFormData(p => ({ ...p, noHp: e.target.value }))} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Select
                            label="Asrama"
                            value={formData.asramaId}
                            onChange={(e) => setFormData(p => ({ ...p, asramaId: e.target.value }))}
                            options={[{ value: '', label: '-- Pilih Asrama --' }, ...asramaList.map((a: any) => ({ value: a.id, label: a.nama }))]}
                        />
                         <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-700">Bio Singkat</label>
                            <textarea 
                                className="w-full h-11 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-medium transition-all"
                                placeholder="I focus on..."
                                value={formData.bio}
                                onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-10 h-12 shadow-xl shadow-blue-900/10" isLoading={isSubmitting}>
                            <Save size={18} className="mr-2" /> Simpan Profil
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}