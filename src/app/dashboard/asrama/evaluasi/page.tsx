'use client'

import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Star, ClipboardEdit, History, Plus, Brain } from 'lucide-react'

export default function EvaluasiAsramaPage() {
    const { data: students, isLoading: isStudentsLoading } = useApi('/users?role=user&kamar_only=true', { immediate: true })
    const { data: history, isLoading: isHistoryLoading, fetchData: fetchHistory } = useApi('/evaluasi', { immediate: true })

    const [isIdModalOpen, setIsIdModalOpen] = useState(false)
    const [selectedSantri, setSelectedSantri] = useState<any>(null)
    const [evaluation, setEvaluation] = useState({ point: 'A', catatan: '' })

    const handleOpenModal = (santri: any) => {
        setSelectedSantri(santri)
        setIsIdModalOpen(true)
    }

    const handleSubmit = async () => {
        try {
            await apiFetch('/evaluasi', {
                method: 'POST',
                body: JSON.stringify({
                    santri_id: selectedSantri.id,
                    poin_evaluasi: evaluation.point,
                    catatan: evaluation.catatan,
                    bulan_evaluasi: new Date().toISOString().substring(0, 7)
                })
            })
            setIsIdModalOpen(false)
            fetchHistory()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Evaluasi Santri</h1>
                <p className="text-slate-500 mt-1">Penilaian berkala untuk adab, kebersihan, dan kedisiplinan asrama.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star size={20} className="text-amber-500 fill-amber-500" />
                            Daftar Santri Kamar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Santri</TableHead>
                                    <TableHead>Status Bulan Ini</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isStudentsLoading ? (
                                    <TableRow><TableCell colSpan={3} className="text-center py-4">Memuat...</TableCell></TableRow>
                                ) : students?.data?.map((s: any) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-medium">{s.full_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">Belum Dievaluasi</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleOpenModal(s)}>
                                                <ClipboardEdit size={14} className="mr-2" />
                                                Input Nilai
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History size={20} className="text-slate-600" />
                            Log Evaluasi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isHistoryLoading ? <p className="text-center py-4">Loading...</p> : (history?.data || []).map((h: any) => (
                            <div key={h.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-sm font-bold truncate max-w-[120px]">{h.santri?.full_name}</p>
                                    <Badge variant="success">{h.poin_evaluasi}</Badge>
                                </div>
                                <p className="text-xs text-slate-500 italic">"{h.catatan}"</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Modal
                isOpen={isIdModalOpen}
                onClose={() => setIsIdModalOpen(false)}
                title={`Evaluasi: ${selectedSantri?.full_name}`}
                description="Berikan penilaian subjektif berdasarkan adab dan kedisiplinan selama satu bulan ini."
            >
                <div className="space-y-4">
                    <Select
                        label="Poin Evaluasi"
                        options={[
                            { value: 'A', label: 'A - Sangat Patuh & Teladan' },
                            { value: 'B', label: 'B - Menjalankan Aturan dengan Baik' },
                            { value: 'C', label: 'C - Perlu Bimbingan Lebih' },
                            { value: 'D', label: 'D - Banyak Pelanggaran' },
                        ]}
                        value={evaluation.point}
                        onChange={(e) => setEvaluation({ ...evaluation, point: e.target.value })}
                    />
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Catatan Kepala Kamar</label>
                        <textarea
                            className="w-full min-h-[100px] p-3 rounded-md border text-sm"
                            placeholder="Tuliskan alasan atau saran untuk santri ini..."
                            value={evaluation.catatan}
                            onChange={(e) => setEvaluation({ ...evaluation, catatan: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsIdModalOpen(false)}>Batal</Button>
                        <Button onClick={handleSubmit} className="gap-2">
                            <Plus size={16} />
                            Simpan Evaluasi
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}