'use client'

import { useApi } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Users, Layout, Plus, CheckCircle2, TrendingUp, UserPlus } from 'lucide-react'

export default function DelegasiDivisiPage() {
    const { data: teamData, isLoading: isTeamLoading } = useApi('/users?role=user&divisi_only=true', { immediate: true })
    const { data: tasksData, isLoading: isTasksLoading } = useApi('/tasks?divisi_only=true', { immediate: true })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Delegasi Divisi</h1>
                    <p className="text-slate-500 mt-1">Kelola anggota divisi Anda dan distribusikan beban kerja secara adil.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                        <UserPlus size={18} />
                        Tambah Anggota
                    </Button>
                    <Button className="flex items-center gap-2">
                        <Plus size={18} />
                        Buat Task
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users size={20} className="text-blue-600" />
                            Anggota Tim
                        </CardTitle>
                        <CardDescription>Staf aktif dalam tanggung jawab divisi Anda.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Anggota</TableHead>
                                    <TableHead>Beban Task</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isTeamLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-4">Memuat tim...</TableCell></TableRow>
                                ) : teamData?.data?.length > 0 ? teamData.data.map((member: any) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium text-slate-900">{member.full_name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: '40%' }}></div>
                                                </div>
                                                <span className="text-xs">2 Aktif</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="success">Online</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Tugas</Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8">Belum ada anggota tim.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Layout size={20} className="text-indigo-600" />
                            Ringkasan Tugas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                            <p className="text-sm font-medium text-indigo-700">Pekerjaan Draft</p>
                            <p className="text-2xl font-bold text-indigo-900">12 Item</p>
                        </div>
                        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
                            <p className="text-sm font-medium text-blue-700">Penyelesaian Minggu Ini</p>
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-blue-600" />
                                <span className="text-2xl font-bold text-blue-900">85%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}