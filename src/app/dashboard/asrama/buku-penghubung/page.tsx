'use client'

import { useApi } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BookOpen, MessageSquare, AlertCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function BukuPenghubungPage() {
    // In this MVP, we use the same evaluasi data as a proxy for disciplinary logs 
    // until the dedicated log table is fully separated in the backend.
    const { data: logs, isLoading } = useApi('/evaluasi', { immediate: true })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Buku Penghubung</h1>
                    <p className="text-slate-500 mt-1">Jalur komunikasi asrama untuk catatan kedisiplinan santri.</p>
                </div>
                <Button className="flex items-center gap-2">
                    <MessageSquare size={18} />
                    Buat Catatan Baru
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <div className="md:col-span-3 space-y-4">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="animate-pulse bg-slate-50 h-32"></Card>
                        ))
                    ) : (logs?.data || []).map((log: any) => (
                        <Card key={log.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                            <BookOpen size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{log.santri?.full_name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                <Calendar size={12} />
                                                {format(new Date(log.created_at), 'eeee, dd MMMM yyyy', { locale: id })}
                                            </div>
                                            <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                                                {log.catatan}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={log.poin_evaluasi === 'A' ? 'success' : 'warning'}>
                                        Grade {log.poin_evaluasi}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {logs?.data?.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                            <AlertCircle className="mx-auto text-slate-300 mb-2" size={48} />
                            <p className="text-slate-500 font-medium">Belum ada catatan hari ini.</p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <Card className="bg-blue-600 text-white border-none">
                        <CardHeader>
                            <CardTitle className="text-lg">Info Wali Santri</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-blue-50 space-y-3">
                            <p>Catatan yang Anda masukkan di sini secara otomatis dapat dilihat oleh Wali Santri melalui aplikasi Mobile.</p>
                            <div className="p-3 bg-white/10 rounded-lg">
                                <p className="font-medium text-white mb-1">Status Sync:</p>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></div>
                                    Real-time active
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}