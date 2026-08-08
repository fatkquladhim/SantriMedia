'use client'

import { useApi } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Award, TrendingUp, UserCheck, AlertTriangle } from 'lucide-react'

export default function KepegawaianPage() {
    const { data: allUsers, isLoading } = useApi('/users', { immediate: true })

    // Filter users with SDM permission or kepala_asrama role
    const staff = allUsers?.data?.filter((u: any) =>
        u.base_role === 'kepala_asrama' ||
        u.dynamic_permissions?.includes('sdm')
    ) || []

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Kepegawaian & Grading</h1>
                    <p className="text-slate-500 mt-1">Monitoring performa dan penilaian berkala staf.</p>
                </div>
                <Button className="flex items-center gap-2">
                    <Award size={18} />
                    Input Nilai Baru
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Rata-rata Performa</CardDescription>
                        <CardTitle className="text-2xl font-bold">A- (Sangat Baik)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                            <TrendingUp size={16} />
                            +2.4% dari bulan lalu
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Staf Aktif Dilayani</CardDescription>
                        <CardTitle className="text-2xl font-bold">{staff.length || 0} Orang</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <UserCheck size={16} />
                            Semua profil terverifikasi
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Perlu Review</CardDescription>
                        <CardTitle className="text-2xl font-bold text-amber-600">3 Laporan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-amber-600 text-sm">
                            <AlertTriangle size={16} />
                            Batas waktu: 3 hari lagi
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Rangking & Grade Staf</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Staf</TableHead>
                                <TableHead>Divisi</TableHead>
                                <TableHead>KPI Score</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Last Evaluated</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-8">Memuat data...</TableCell></TableRow>
                            ) : staff.map((u: any) => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">{u.full_name}</TableCell>
                                    <TableCell>{u.divisi?.nama || '-'}</TableCell>
                                    <TableCell>88 / 100</TableCell>
                                    <TableCell>
                                        <Badge variant="success">A-</Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-xs">01 Maret 2026</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm">Histori</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}