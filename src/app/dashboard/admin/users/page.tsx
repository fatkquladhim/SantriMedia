'use client'

import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Search, RefreshCw, Mail, User, Hash, Shield, Loader2, Save, Trash2, Plus } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Modal } from '@/components/ui/Modal'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

export default function AdminUsersPage() {
    const [search, setSearch] = useState('')
    const { data: usersData, isLoading, fetchData } = useApi('/users', { immediate: true })
    const [activeTab, setActiveTab] = useState<'users' | 'whitelist'>('users')

    // User Detail & Manage States
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [isDetailLoading, setIsDetailLoading] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [isUpdating, setIsUpdating] = useState(false)
    
    // Edit Form States
    const [targetRole, setTargetRole] = useState('')
    const [newPermission, setNewPermission] = useState('')
    const [permissionTarget, setPermissionTarget] = useState('')
    
    // Whitelist States
    const [whitelist, setWhitelist] = useState<any[]>([])
    const [isWhitelistLoading, setIsWhitelistLoading] = useState(false)
    const [newWhitelistEmail, setNewWhitelistEmail] = useState('')
    const [isAddingWhitelist, setIsAddingWhitelist] = useState(false)
    
    // Create User States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [createForm, setCreateForm] = useState({
        full_name: '',
        email: '',
        password: '',
        base_role: 'user'
    })

    // Options for Dynamic Permissions
    const PERMISSION_OPTIONS = [
        { value: 'ketua_divisi', label: 'Ketua Divisi (Pilih Divisi)' },
        { value: 'ketua_platform', label: 'Ketua Platform (Pilih Platform)' },
        { value: 'staf_kantor', label: 'Staf Kantor' },
        { value: 'staf_alat', label: 'Staf Alat' },
        { value: 'sdm', label: 'SDM' },
    ]

    useEffect(() => {
        if (activeTab === 'whitelist') {
            fetchWhitelist()
        }
    }, [activeTab])

    const fetchWhitelist = async () => {
        setIsWhitelistLoading(true)
        try {
            const res = await apiFetch('/rbac/whitelist')
            setWhitelist(res.data || [])
        } catch (err) {
            console.error('Failed to fetch whitelist:', err)
        } finally {
            setIsWhitelistLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchData(`/users?search=${search}`)
    }

    const handleViewDetail = async (userId: string) => {
        setIsDetailModalOpen(true)
        setIsDetailLoading(true)
        try {
            const res = await apiFetch(`/users/${userId}`)
            const user = res.data || res
            setSelectedUser(user)
            setTargetRole(user.base_role)
            setNewPermission('')
            setPermissionTarget('')
        } catch (err) {
            console.error('Failed to fetch user detail:', err)
        } finally {
            setIsDetailLoading(false)
        }
    }

    const handleUpdateRole = async () => {
        if (!selectedUser) return
        setIsUpdating(true)
        try {
            await apiFetch(`/rbac/${selectedUser.id}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role: targetRole })
            })
            handleViewDetail(selectedUser.id)
            fetchData('/users')
        } catch (err) {
            alert('Gagal update role')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleGrantPermission = async () => {
        if (!newPermission) return
        setIsUpdating(true)
        try {
            await apiFetch(`/rbac/${selectedUser.id}/permissions`, {
                method: 'POST',
                body: JSON.stringify({ 
                    permission: newPermission,
                    target_id: permissionTarget || null
                })
            })
            handleViewDetail(selectedUser.id)
        } catch (err) {
            alert('Gagal tambah izin')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleRevokePermission = async (permission: string, targetId: string | null) => {
        if (!confirm('Cabut izin ini?')) return
        setIsUpdating(true)
        try {
            await apiFetch(`/rbac/${selectedUser.id}/permissions`, {
                method: 'DELETE',
                body: JSON.stringify({ 
                    permission,
                    target_id: targetId
                })
            })
            handleViewDetail(selectedUser.id)
        } catch (err) {
            alert('Gagal cabut izin')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleAddWhitelist = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newWhitelistEmail) return
        setIsAddingWhitelist(true)
        try {
            await apiFetch('/rbac/whitelist', {
                method: 'POST',
                body: JSON.stringify({ email: newWhitelistEmail })
            })
            setNewWhitelistEmail('')
            fetchWhitelist()
        } catch (err) {
            alert('Gagal menambah email. Mungkin sudah ada di daftar.')
        } finally {
            setIsAddingWhitelist(false)
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)
        try {
            await apiFetch('/users', {
                method: 'POST',
                body: JSON.stringify(createForm)
            })
            setIsCreateModalOpen(false)
            setCreateForm({ full_name: '', email: '', password: '', base_role: 'user' })
            fetchData('/users')
        } catch (err: any) {
            alert(err.message || 'Gagal membuat user')
        } finally {
            setIsCreating(false)
        }
    }

    const handleRemoveWhitelist = async (email: string) => {
        if (!confirm(`Hapus ${email} dari whitelist? User ini tidak akan bisa mendaftar lagi.`)) return
        try {
            await apiFetch(`/rbac/whitelist/${email}`, { method: 'DELETE' })
            fetchWhitelist()
        } catch (err) {
            alert('Gagal menghapus email.')
        }
    }

    const getRoleBadge = (user: any) => {
        const badges = []
        
        switch (user.base_role) {
            case 'admin': 
                badges.push(<Badge key="admin" variant="error" className="bg-rose-100 text-rose-700 border-rose-200 shadow-sm">Admin</Badge>)
                break
            case 'kepala_asrama': 
                badges.push(<Badge key="asrama" variant="info" className="bg-sky-100 text-sky-700 border-sky-200 shadow-sm">Kepala Asrama</Badge>)
                break
            default: 
                badges.push(<Badge key="user" variant="default" className="bg-blue-100 text-blue-700 border-blue-200 shadow-sm">Santri</Badge>)
        }

        // Add Dynamic Permission Badges
        const perms = user.dynamic_permissions?.map((p: any) => p.permission) || []
        if (perms.includes('staf_alat')) badges.push(<Badge key="alat" className="bg-amber-100 text-amber-700 border-amber-200 ml-1">Staf Alat</Badge>)
        if (perms.includes('staf_kantor')) badges.push(<Badge key="kantor" className="bg-slate-100 text-slate-700 border-slate-200 ml-1">Staf Kantor</Badge>)
        if (perms.includes('sdm')) badges.push(<Badge key="sdm" className="bg-indigo-100 text-indigo-700 border-indigo-200 ml-1">SDM</Badge>)
        if (perms.includes('ketua_divisi')) badges.push(<Badge key="ketua" className="bg-violet-100 text-violet-700 border-violet-200 ml-1">Ketua</Badge>)
        
        return <div className="flex flex-wrap gap-1">{badges}</div>
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Otoritas User</h1>
                    <p className="text-slate-500 font-medium">Kelola siapa saja yang berhak masuk dan peran mereka.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white h-12 px-6 rounded-2xl font-bold flex items-center gap-2 shadow-xl"
                    >
                        <Plus size={18} /> Tambah Master User
                    </Button>
                    <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
                        <button 
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-1.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            User Aktif
                        </button>
                        <button 
                            onClick={() => setActiveTab('whitelist')}
                            className={`px-6 py-1.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'whitelist' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Whitelist
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'users' ? (
                <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden bg-white rounded-[32px]">
                    <CardHeader className="border-b border-slate-50 p-8">
                        <form onSubmit={handleSearch} className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Cari nama atau email..."
                                    className="pl-12 h-14 w-full rounded-[20px] bg-slate-50 border-none px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-8 rounded-[20px] font-black tracking-wide shadow-lg shadow-blue-500/20">CARI USER</Button>
                            <Button variant="outline" type="button" onClick={() => fetchData('/users')} className="h-14 w-14 rounded-[20px] border-slate-100">
                                <RefreshCw className={isLoading ? 'animate-spin' : ''} />
                            </Button>
                        </form>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="px-8 font-black text-slate-400 uppercase text-[10px] tracking-widest h-16">Nama Pengguna</TableHead>
                                        <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest h-16">Identitas</TableHead>
                                        <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest h-16">Role</TableHead>
                                        <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest h-16">Bergabung</TableHead>
                                        <TableHead className="text-right px-8 font-black text-slate-400 uppercase text-[10px] tracking-widest h-16">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}><TableCell colSpan={5} className="h-24"><div className="flex justify-center"><Loader2 className="animate-spin text-blue-200" size={32} /></div></TableCell></TableRow>
                                        ))
                                    ) : usersData?.data?.length > 0 ? (
                                        usersData.data.map((u: any) => (
                                            <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <TableCell className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg border border-blue-100 overflow-hidden shrink-0 shadow-sm">
                                                        {u.avatar_url ? (
                                                            <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            u.full_name.charAt(0)
                                                        )}
                                                    </div>
                                                        <div>
                                                            <div className="font-black text-slate-800 text-lg leading-tight">{u.full_name}</div>
                                                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{u.divisi?.nama || 'Tanpa Divisi'}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-bold text-slate-600">{u.email}</div>
                                                    <div className="text-[10px] font-black text-slate-300 uppercase leading-none mt-1">NIS: {u.nomor_induk || '-'}</div>
                                                </TableCell>
                                                <TableCell>{getRoleBadge(u)}</TableCell>
                                                <TableCell className="text-slate-500 font-bold text-sm italic">
                                                    {format(new Date(u.created_at), 'dd MMM yyyy', { locale: id })}
                                                </TableCell>
                                                <TableCell className="text-right px-8">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleViewDetail(u.id)}
                                                        className="h-11 px-5 rounded-xl border-slate-200 hover:border-blue-500 hover:text-blue-600 font-black text-xs tracking-wider transition-all"
                                                    >
                                                        KONTROL AKSES
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-60 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-slate-300">
                                                    <User size={48} className="opacity-20" />
                                                    <p className="font-bold">Tidak ada user ditemukan.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    {/* Add to Whitelist Form */}
                    <Card className="lg:col-span-1 border-none shadow-xl bg-slate-900 text-white rounded-[32px] h-fit sticky top-8">
                        <CardHeader className="p-8 pb-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
                                <Plus size={24} />
                            </div>
                            <CardTitle className="text-2xl font-black">Tambah Whitelist</CardTitle>
                            <p className="text-slate-400 text-sm font-medium">Hanya email di daftar ini yang bisa melakukan registrasi akun baru.</p>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-4">
                            <form onSubmit={handleAddWhitelist} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email Santri/Staff</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="contoh@pesantrendigital.com"
                                        className="w-full h-14 px-5 rounded-[20px] bg-white/5 border border-white/10 text-white font-bold focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600"
                                        value={newWhitelistEmail}
                                        onChange={(e) => setNewWhitelistEmail(e.target.value)}
                                    />
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={isAddingWhitelist}
                                    className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-slate-900 rounded-[20px] font-black text-sm tracking-wide shadow-lg shadow-blue-500/10 transition-all uppercase"
                                >
                                    {isAddingWhitelist ? <Loader2 className="animate-spin" /> : 'Izinkan Registrasi'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Whitelist List */}
                    <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[32px]">
                        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-black text-slate-800">Daftar Email yang Diijinkan</CardTitle>
                            <Button variant="outline" size="sm" onClick={fetchWhitelist} className="rounded-xl border-slate-100">
                                <RefreshCw size={14} className={isWhitelistLoading ? 'animate-spin' : ''} />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="min-h-[400px]">
                                {isWhitelistLoading ? (
                                    <div className="flex justify-center items-center h-80"><Loader2 className="animate-spin text-blue-500" /></div>
                                ) : whitelist.length > 0 ? (
                                    <div className="divide-y divide-slate-50">
                                        {whitelist.map((item: any) => (
                                            <div key={item.email} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                        <Mail size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-700">{item.email}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Terdaftar Whitelist: {format(new Date(item.created_at), 'dd MMM yyyy')}</div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleRemoveWhitelist(item.email)}
                                                    className="p-3 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-80 text-slate-300 gap-2">
                                        <Shield size={64} className="opacity-10 mb-2" />
                                        <p className="font-black text-lg">Whitelist Kosong</p>
                                        <p className="text-sm font-medium">Belum ada email yang diizinkan untuk mendaftar mandiri.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Manajemen Role & Izin"
                size="lg"
            >
                {isDetailLoading || !selectedUser ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                        <p className="font-medium">Memuat data akses...</p>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                        {/* Summary Header */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm border border-blue-100/50">
                                <User size={32} />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 leading-tight">{selectedUser.full_name}</h4>
                                <p className="text-sm text-blue-700 font-medium">NIS: {selectedUser.nomor_induk || 'Belum diatur'}</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Role Management Section */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Shield size={14} /> Base Role
                                </label>
                                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                                    <Select
                                        value={targetRole}
                                        onChange={(e) => setTargetRole(e.target.value)}
                                        options={[
                                            { value: 'user', label: 'User / Santri Regular' },
                                            { value: 'kepala_asrama', label: 'Kepala Asrama (Akses Asrama)' },
                                            { value: 'admin', label: 'Admin (Akses Penuh)' },
                                        ]}
                                    />
                                    <Button 
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-medium gap-2 shadow-lg shadow-blue-500/20"
                                        onClick={handleUpdateRole}
                                        disabled={isUpdating || targetRole === selectedUser.base_role}
                                    >
                                        {isUpdating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Update Role
                                    </Button>
                                </div>
                            </div>

                            {/* Permissions Setup Section */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Plus size={14} /> Grant Permission
                                </label>
                                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                                    <Select 
                                        value={newPermission}
                                        onChange={(e) => setNewPermission(e.target.value)}
                                        placeholder="Pilih Izin Dinamis..."
                                        options={PERMISSION_OPTIONS}
                                    />
                                    
                                    {(newPermission === 'ketua_divisi' || newPermission === 'ketua_platform') && (
                                        <Input 
                                            placeholder="Masukkan ID Divisi/Platform"
                                            value={permissionTarget}
                                            onChange={(e) => setPermissionTarget(e.target.value)}
                                            className="h-11 rounded-xl"
                                        />
                                    )}

                                    <Button 
                                        variant="outline"
                                        className="w-full border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-xl h-11 font-medium"
                                        onClick={handleGrantPermission}
                                        disabled={isUpdating || !newPermission}
                                    >
                                        Memberi Akses
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* List of Current Permissions */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                Aktif Permissions ({selectedUser.dynamic_permissions?.length || 0})
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {selectedUser.dynamic_permissions?.length > 0 ? (
                                    selectedUser.dynamic_permissions.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group">
                                            <div>
                                                <div className="text-sm font-bold text-slate-700 uppercase tracking-tight">{p.permission.replace('_', ' ')}</div>
                                                {p.target_name && (
                                                    <div className="text-[10px] font-medium text-slate-400">{p.target_name}</div>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => handleRevokePermission(p.permission, p.target_id)}
                                                className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 py-8 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 italic text-sm">
                                        Tidak ada izin akses dinamis aktif.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Tambah User Baru */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Tambah User / Staf Baru"
                size="md"
            >
                <form onSubmit={handleCreateUser} className="space-y-6 py-4">
                    <div className="space-y-4">
                        <Input 
                            label="Nama Lengkap" 
                            placeholder="Contoh: Muhammad Akhyar"
                            value={createForm.full_name}
                            onChange={(e) => setCreateForm({...createForm, full_name: e.target.value})}
                            required
                        />
                        <Input 
                            label="Alamat Email" 
                            type="email"
                            placeholder="akhyar@pesantrendigital.com"
                            value={createForm.email}
                            onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                            required
                        />
                        <Input 
                            label="Password Awal" 
                            type="password"
                            placeholder="Minimal 6 karakter"
                            value={createForm.password}
                            onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                            required
                        />
                        <Select
                            label="Peran (Role) Utama"
                            value={createForm.base_role}
                            onChange={(e) => setCreateForm({...createForm, base_role: e.target.value})}
                            options={[
                                { value: 'user', label: 'Santri / Developer' },
                                { value: 'kepala_asrama', label: 'Kepala Asrama' },
                                { value: 'admin', label: 'Administrator Sistem' },
                            ]}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                        <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Batal</Button>
                        <Button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-10 h-12 shadow-xl shadow-blue-500/20"
                            isLoading={isCreating}
                        >
                            Buat Akun Sekarang
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}