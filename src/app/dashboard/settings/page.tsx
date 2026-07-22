'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { apiFetch } from '@/lib/api'
import { 
    User, Shield, Settings as SettingsIcon, 
    Save, Camera, Bell, Lock, Database, Loader2 
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
    const { user, setUser } = useAuthStore()
    const isAdmin = user?.baseRole === 'admin'
    
    const [activeTab, setActiveTab] = useState('profile')
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    
    // Form States
    const [fullName, setFullName] = useState('')
    const [bio, setBio] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')

    useEffect(() => {
        if (user) {
            setFullName(user.fullName || '')
            setBio(user.bio || '')
            setAvatarUrl(user.avatarUrl || '')
        }
    }, [user])

    if (!user) return null

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            // Kita gunakan FormData untuk upload ke backend, 
            // atau jika ada konfigurasi Supabase di frontend bisa langsung.
            // Di sini saya asumsikan kita lewat API backend agar lebih aman & terpusat.
            const formData = new FormData()
            formData.append('file', file)

            const res = await apiFetch('/upload/avatar', {
                method: 'POST',
                body: formData
            })
            
            if (res.success) {
                const newUrl = `${res.data.url}?t=${Date.now()}`
                setAvatarUrl(newUrl)

                // Simpan hanya avatarUrl — jangan ikut sertakan fullName/bio
                // dari state lama karena user mungkin belum klik Save Changes
                const saveRes = await apiFetch('/users/me', {
                    method: 'PATCH',
                    body: JSON.stringify({ avatarUrl: newUrl })
                })

                if (saveRes.success) {
                    setUser({ ...user, avatarUrl: newUrl })
                    alert('Foto profil berhasil diperbarui!')
                }
            }
        } catch (err: any) {
            alert(err?.message || 'Gagal mengunggah foto.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await apiFetch('/users/me', {
                method: 'PATCH',
                body: JSON.stringify({ full_name: fullName, bio, avatar_url: avatarUrl })
            })

            if (res.success) {
                setUser({ ...user, fullName, bio, avatarUrl })
                alert('Profil berhasil diperbarui!')
            }
        } catch (err: any) {
            alert(err?.message || 'Gagal memperbarui profil.')
        } finally {
            setIsSaving(false)
        }
    }

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'account', label: 'Account', icon: Lock },
        ...(isAdmin ? [{ id: 'system', label: 'System Config', icon: Database }] : []),
        { id: 'notif', label: 'Notifications', icon: Bell },
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">Settings</h1>
                    <p className="text-slate-500 font-medium">Beautify and manage your ERP workspace.</p>
                </div>
                
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-900/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-1 space-y-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all",
                                    isActive 
                                        ? "bg-white text-blue-600 shadow-sm border border-blue-100" 
                                        : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
                                )}
                            >
                                <Icon size={20} className={isActive ? "text-blue-500" : "text-slate-400"} />
                                {tab.label}
                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                            </button>
                        )
                    })}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="glass-panel p-10 rounded-[40px] shadow-xl shadow-slate-100 space-y-10">
                        
                        {activeTab === 'profile' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                {/* Avatar Section */}
                                <div className="flex flex-col sm:flex-row items-center gap-8">
                                    <div className="relative group">
                                        <input 
                                            type="file" 
                                            id="avatar-upload" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                        />
                                        
                                        <label 
                                            htmlFor="avatar-upload"
                                            className="w-32 h-32 rounded-[40px] bg-blue-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden cursor-pointer hover:ring-4 hover:ring-blue-500/20 transition-all group-active:scale-95">
                                            {isUploading ? (
                                                <Loader2 className="animate-spin text-blue-500" size={32} />
                                            ) : avatarUrl ? (
                                                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={48} className="text-blue-200" />
                                            )}
                                            
                                            {/* Camera Overlay on Hover */}
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera size={24} className="text-white" />
                                            </div>
                                        </label>
                                    </div>
                                    <div className="text-center sm:text-left space-y-2">
                                        <h3 className="text-xl font-black text-slate-800">Profile Picture</h3>
                                        <p className="text-sm text-slate-500 max-w-xs">Klik pada gambar untuk upload foto terbaikmu (PNG/JPG, Maks 2MB).</p>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full h-14 px-5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500/20 font-bold transition-all text-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Title / Designation</label>
                                        <input 
                                            type="text" 
                                            defaultValue={user.baseRole.replace('_', ' ')}
                                            disabled
                                            className="w-full h-14 px-5 rounded-2xl bg-slate-100 border-none font-bold text-slate-400 cursor-not-allowed uppercase text-[10px]"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Biography</label>
                                        <textarea 
                                            rows={4}
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Tuliskan sedikit tentang diri Anda..."
                                            className="w-full p-5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500/20 font-bold transition-all text-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'system' && isAdmin && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 shadow-inner">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800">Global Point Policy</h3>
                                        <p className="text-sm text-slate-500">Configure how many points santri get for their contributions.</p>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-3 gap-6">
                                    {[
                                        { label: 'Low Difficulty', val: 10 },
                                        { label: 'Medium Difficulty', val: 25 },
                                        { label: 'High Difficulty', val: 50 },
                                    ].map((p, i) => (
                                        <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{p.label}</p>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="number" 
                                                    defaultValue={p.val}
                                                    className="w-full bg-transparent border-none p-0 text-3xl font-black text-slate-900 focus:ring-0"
                                                />
                                                <span className="text-xs font-bold text-slate-400 uppercase">pts</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 rounded-3xl bg-blue-900 text-white space-y-4 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                                        <SettingsIcon size={80} />
                                    </div>
                                    <h4 className="font-bold">Automated Review Period</h4>
                                    <p className="text-xs text-blue-100/70 max-w-md">How many days before a task is automatically approved if a Division Head doesn't review it.</p>
                                    <select className="bg-blue-800 border-none rounded-xl font-bold text-sm px-4 py-2 focus:ring-0">
                                        <option>3 Days</option>
                                        <option>7 Days</option>
                                        <option>Manual Only</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {activeTab === 'account' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-6">
                                    <h3 className="text-xl font-black text-slate-800">Email Address</h3>
                                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                                        <input 
                                            type="email" 
                                            defaultValue={user.email}
                                            disabled
                                            className="flex-1 h-14 px-5 rounded-2xl bg-slate-100 border-none font-bold text-slate-400 cursor-not-allowed"
                                        />
                                        <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-2 rounded-xl text-xs font-black">VERIFIED</Badge>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-xl font-black text-slate-800">Social Accounts</h3>
                                    <div className="p-6 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-between group hover:border-blue-300 transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-all">
                                                <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">Google Account</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-xs font-black text-blue-600 uppercase tracking-widest">CONNECTED</div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>
        </div>
    )
}