'use client'

import { useState, useMemo } from 'react'
import { apiFetch } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Shield, ShieldAlert, User, Check, X, Search, Loader2, RefreshCw, AlertCircle, Info, ChevronRight, Key, Bell, CheckCircle2 } from 'lucide-react'

export default function AdminRBACPage() {
    // Users List for Sidebar
    const { data: allUsers, isLoading: isUsersLoading, fetchData: refreshUsers } = useApi('/users', { immediate: true })
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

    // Notification State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 3000)
    }

    // Detailed User Permission Data
    const {
        data: userData,
        isLoading: isDetailLoading,
        error: detailError,
        fetchData: fetchUserDetail
    } = useApi(selectedUserId ? `/rbac/${selectedUserId}/permissions` : '', { immediate: false })

    const [isUpdating, setIsUpdating] = useState(false)
    const [scopingPermission, setScopingPermission] = useState<string | null>(null)

    // For Scoped Selection
    const { data: divisions } = useApi('/divisi', { immediate: true })
    const divisionList = Array.isArray(divisions) ? divisions : (divisions?.data || [])

    // Filter users for sidebar
    const filteredUsers = useMemo(() => {
        const list = Array.isArray(allUsers) ? allUsers : (allUsers?.data || [])
        if (!searchTerm) return list
        return list.filter((u: any) =>
            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [allUsers, searchTerm])

    const handleSelectUser = (id: string) => {
        setSelectedUserId(id)
        fetchUserDetail(`/rbac/${id}/permissions`)
    }

    const updateRole = async (newRole: string) => {
        if (!selectedUserId) return
        setIsUpdating(true)
        try {
            await apiFetch(`/rbac/${selectedUserId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole }) // Backend expect 'role'
            })
            fetchUserDetail()
            refreshUsers() // Update role in list too
            showNotification(`Role ${userData.full_name} berhasil diubah ke ${newRole.replace('_', ' ')}`)
        } catch (err: any) {
            showNotification(err.message || "Gagal mengubah role", "error")
            console.error(err)
        } finally {
            setIsUpdating(false)
        }
    }

    const togglePermission = async (permission: string, hasPerm: boolean, targetId: string | null = null) => {
        if (!selectedUserId) return
        setIsUpdating(true)
        try {
            if (hasPerm) {
                await apiFetch(`/rbac/${selectedUserId}/permissions`, {
                    method: 'DELETE',
                    body: JSON.stringify({ permission, target_id: targetId })
                })
                showNotification(`Izin ${permission.replace('_', ' ')} dicabut`)
            } else {
                await apiFetch(`/rbac/${selectedUserId}/permissions`, {
                    method: 'POST',
                    body: JSON.stringify({ permission, target_id: targetId })
                })
                showNotification(`Izin ${permission.replace('_', ' ')} diberikan`)
            }
            fetchUserDetail()
            setScopingPermission(null)
        } catch (err: any) {
            showNotification(err.message || "Gagal memperbarui izin", "error")
            console.error(err)
        } finally {
            setIsUpdating(false)
        }
    }

    const roles = [
        { value: 'user', label: 'Santri / Regular User' },
        { value: 'kepala_asrama', label: 'Kepala Asrama' },
        { value: 'admin', label: 'Administrator System' },
    ]

    const getRoleVariant = (role: string) => {
        switch (role?.toLowerCase()) {
            case 'admin': return 'error'
            case 'kepala_asrama': return 'warning'
            case 'sdm': return 'success'
            default: return 'info'
        }
    }

    const dynamicPermissions = [
        { id: 'staf_kantor', label: 'Staf Kantor', desc: 'Akses ke administrasi kantor' },
        { id: 'staf_alat', label: 'Staf Alat', desc: 'Kelola inventaris asrama' },
        { id: 'ketua_divisi', label: 'Ketua Divisi', desc: 'Akses delegasi tugas divisi' },
        { id: 'sdm', label: 'SDM / HRD', desc: 'Hak kases manajemen SDM/Staf' }
    ]

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            {/* Success/Error Toast */}
            {notification && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top-full duration-300 ${notification.type === 'success'
                    ? 'bg-blue-50 border-blue-100 text-blue-800'
                    : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle2 className="text-blue-500" size={24} /> : <AlertCircle className="text-rose-500" size={24} />}
                    <div className="flex flex-col">
                        <p className="text-sm font-black leading-none">{notification.type === 'success' ? 'Berhasil!' : 'Gagal'}</p>
                        <p className="text-xs font-medium mt-1.5 opacity-80">{notification.message}</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">RBAC & Permissions</h1>
                    <p className="text-slate-500 mt-1">Atur hak akses granular dan peran dasar untuk setiap pengguna.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                    <Shield size={14} />
                    SYSTEM SECURITY ACTIVE
                </div>
            </div>

            <div className="grid gap-4 lg:gap-0 lg:grid-cols-12 h-auto lg:h-[calc(100vh-220px)] border rounded-2xl lg:overflow-hidden bg-white shadow-sm">

                {/* Sidebar: User List */}
                <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r bg-slate-50/30 flex flex-col min-h-[400px] lg:h-full">
                    <div className="p-4 border-b bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                                placeholder="Cari nama atau email..."
                                className="pl-10 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 lg:overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {isUsersLoading ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
                                <RefreshCw className="animate-spin" size={20} />
                                <p className="text-xs font-medium">Memuat data user...</p>
                            </div>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((u: any) => (
                                <button
                                    key={u.id}
                                    onClick={() => handleSelectUser(u.id)}
                                    className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${selectedUserId === u.id
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                                        : 'hover:bg-white hover:shadow-sm text-slate-700'
                                        }`}
                                >
                                    <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${selectedUserId === u.id ? 'bg-white/20' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                        {u.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold truncate leading-tight">{u.full_name}</p>
                                        <p className={`text-[10px] truncate ${selectedUserId === u.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {u.email}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-1.5">
                                            {u.user_permissions?.length > 0 && (
                                                <div className="p-1 rounded-md bg-amber-500/20 text-amber-500" title="Memiliki Izin Dinamis">
                                                    <Shield size={10} fill="currentColor" />
                                                </div>
                                            )}
                                            <Badge
                                                variant={u.base_role === 'admin' ? 'error' : 'info'}
                                                className={`px-1.5 py-0 text-[8px] h-4 uppercase ${selectedUserId === u.id ? 'bg-white/20 border-white/20 text-white' : ''}`}
                                            >
                                                {u.base_role?.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <ChevronRight size={14} className={selectedUserId === u.id ? 'text-white' : 'text-slate-300'} />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-12 px-4">
                                <Info size={32} className="mx-auto text-slate-200 mb-2" />
                                <p className="text-sm text-slate-400">User tidak ditemukan</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content: Permissions */}
                <div className="lg:col-span-8 flex flex-col h-full bg-slate-50/20 min-h-[500px]">
                    {!selectedUserId ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-60">
                            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-6">
                                <ShieldAlert size={48} className="animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Pilih Pengguna</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-3">
                                Pilih pengguna dari daftar di sebelah kiri untuk melihat dan mengelola hak akses granular.
                            </p>
                        </div>
                    ) : isDetailLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                            <p className="font-medium">Menarik data perizinan...</p>
                        </div>
                    ) : detailError ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <AlertCircle size={48} className="text-rose-500 mb-4" />
                            <h3 className="font-bold text-slate-900">Gagal Memuat Data</h3>
                            <p className="text-sm text-slate-500 mt-2">{detailError}</p>
                            <Button variant="outline" className="mt-6" onClick={() => fetchUserDetail()}>Coba Lagi</Button>
                        </div>
                    ) : (
                        <div className="flex-1 lg:overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6 custom-scrollbar">

                            {/* User Header Info */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 translate-x-4 -translate-y-4 opacity-5 text-blue-600 group-hover:scale-110 transition-transform">
                                    <Shield size={120} />
                                </div>

                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-100">
                                        {userData.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 leading-none">{userData.full_name}</h2>
                                        <p className="text-slate-500 font-medium mt-1">{userData.email}</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <Badge variant={getRoleVariant(userData.base_role)} className="px-3 py-0.5 rounded-full font-bold tracking-tight uppercase">
                                                {userData.base_role?.toUpperCase() || "-"}
                                            </Badge>
                                            {userData.dynamic_permissions?.length > 0 && (
                                                <Badge variant="warning" className="px-3 py-0.5 rounded-full font-bold tracking-tight uppercase flex items-center gap-1.5 bg-amber-100 text-amber-700 border-amber-200">
                                                    <Shield size={12} fill="currentColor" />
                                                    {userData.dynamic_permissions.length} IZIN KHUSUS
                                                </Badge>
                                            )}
                                            <span className="text-[10px] text-slate-400 font-mono tracking-tighter">UID: {userData.id}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Base Role Section */}
                                <Card className="border-slate-200/60 shadow-none">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider mb-1">
                                            <Key size={14} />
                                            Role Utama
                                        </div>
                                        <CardTitle className="text-lg">Tingkat Akses Dasar</CardTitle>
                                        <CardDescription>Menentukan menu default dan otoritas dasar sistem.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <Select
                                                options={roles}
                                                value={userData.base_role}
                                                onChange={(e) => updateRole(e.target.value)}
                                                disabled={isUpdating}
                                            />
                                        </div>
                                        {isUpdating && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 animate-pulse bg-blue-50 p-2 rounded-lg">
                                                <RefreshCw size={10} className="animate-spin" />
                                                MENYINKRONKAN KE SERVER...
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* System Info Card */}
                                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none text-white overflow-hidden relative">
                                    <div className="absolute bottom-0 right-0 p-4 translate-x-4 translate-y-4 opacity-10">
                                        <Shield size={100} />
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-white">
                                            <ShieldAlert size={20} className="text-amber-400" />
                                            Audit Keamanan
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 relative z-10">
                                        <div className="flex items-center justify-between py-2 border-b border-white/10">
                                            <span className="text-slate-400 text-xs">Status Akun</span>
                                            <Badge variant="success" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Active</Badge>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-white/10">
                                            <span className="text-slate-400 text-xs">Last Change</span>
                                            <span className="text-[10px] font-mono">2024-03-06 14:12</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed italic">
                                            * Perubahan role utama akan merestart sesi pengguna secara otomatis di sisi client.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Dynamic Permissions Section */}
                            <Card className="border-slate-200/60 shadow-none">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider mb-1">
                                        <LayoutGrid size={14} />
                                        Custom Permissions
                                    </div>
                                    <CardTitle className="text-xl">Dynamic Special Privileges</CardTitle>
                                    <CardDescription>Hak akses tambahan spesifik untuk tugas operasional tertentu di pesantren.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {dynamicPermissions.map((perm) => {
                                            const isScoped = perm.id === 'ketua_divisi'
                                            const scopes = userData.dynamic_permissions?.filter((p: any) => p.permission === perm.id) || []
                                            const hasMainPerm = scopes.length > 0

                                            return (
                                                <div key={perm.id} className="space-y-3">
                                                    <div
                                                        className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${hasMainPerm
                                                            ? 'bg-blue-50/50 border-blue-100 shadow-sm'
                                                            : 'bg-white border-slate-100 hover:border-slate-200'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${hasMainPerm ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                                                }`}>
                                                                {hasMainPerm ? <Shield size={18} /> : <ShieldAlert size={18} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900">{perm.label}</p>
                                                                <p className="text-[10px] text-slate-500">{perm.desc}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                if (isScoped) {
                                                                    setScopingPermission(scopingPermission === perm.id ? null : perm.id)
                                                                } else {
                                                                    togglePermission(perm.id, !!hasMainPerm)
                                                                }
                                                            }}
                                                            disabled={isUpdating}
                                                            className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${hasMainPerm
                                                                ? 'bg-blue-100 text-blue-700 hover:bg-rose-100 hover:text-rose-600'
                                                                : 'bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white'
                                                                }`}
                                                        >
                                                            {isUpdating ? <Loader2 size={16} className="animate-spin" /> : hasMainPerm ? (isScoped ? <Key size={18} /> : <Check size={18} />) : <PlusIcon size={18} />}
                                                        </button>
                                                    </div>

                                                    {/* Scoped Entity List */}
                                                    {isScoped && hasMainPerm && (
                                                        <div className="pl-4 border-l-2 border-blue-100 space-y-1 ml-5">
                                                            {scopes.map((s: any) => (
                                                                <div key={s.id} className="flex items-center justify-between text-[10px] bg-white p-2 rounded-lg border border-slate-100">
                                                                    <div className="font-bold text-slate-700">
                                                                        {s.target_name || "Global Access"}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => togglePermission(perm.id, true, s.target_id)}
                                                                        className="text-rose-500 hover:text-rose-700 font-black p-1"
                                                                    >
                                                                        REMOVE
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Scoping Selector Modal/Dropdown */}
                                                    {scopingPermission === perm.id && (
                                                        <div className="p-3 bg-slate-900 rounded-xl animate-in zoom-in-95 duration-200 ml-5 relative z-20 shadow-xl border border-slate-700">
                                                            <div className="text-[10px] font-black text-slate-400 mb-2 px-1">PILIH TARGET ({perm.label.toUpperCase()})</div>
                                                            <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                                                                {divisionList.map((target: any) => {
                                                                    const alreadyAssigned = scopes.some((s: any) => s.target_id === target.id)
                                                                    return (
                                                                        <button
                                                                            key={target.id}
                                                                            onClick={() => togglePermission(perm.id, alreadyAssigned, target.id)}
                                                                            className={`text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${alreadyAssigned
                                                                                ? 'bg-blue-600 text-white font-bold'
                                                                                : 'text-slate-300 hover:bg-slate-800'
                                                                                }`}
                                                                        >
                                                                            {target.nama}
                                                                            {alreadyAssigned ? <Check size={12} /> : <PlusIcon size={10} />}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                            <button
                                                                onClick={() => setScopingPermission(null)}
                                                                className="w-full mt-2 text-[10px] text-slate-500 hover:text-white font-bold py-1 border-t border-slate-800"
                                                            >
                                                                BATAL
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function PlusIcon({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
    )
}

function LayoutGrid({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
    )
}