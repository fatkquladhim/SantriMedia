"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function CompleteProfilePage() {
    const [nomorInduk, setNomorInduk] = useState('')
    const [alamat, setAlamat] = useState('')
    const [nomorDarurat, setNomorDarurat] = useState('')
    const [divisiId, setDivisiId] = useState('')
    const [kamarId, setKamarId] = useState('')

    const [divisiOptions, setDivisiOptions] = useState<{ value: string, label: string }[]>([])
    const [kamarOptions, setKamarOptions] = useState<{ value: string, label: string }[]>([])

    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()
    const { fetchUser, user } = useAuthStore()

    useEffect(() => {
        const loadOnboardingData = async () => {
            try {
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/onboarding-data`, {
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`
                    }
                })

                if (response.ok) {
                    const res = await response.json()
                    setDivisiOptions(res.data.divisi.map((d: any) => ({ value: d.id, label: d.nama })))
                    setKamarOptions(res.data.kamar.map((k: any) => ({ value: k.id, label: k.label })))
                }
            } catch (err) {
                console.error('Failed to fetch onboarding data:', err)
            } finally {
                setIsFetching(false)
            }
        }

        if (user) {
            loadOnboardingData()
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/complete-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    nomor_induk: nomorInduk,
                    divisi_id: divisiId,
                    kamar_id: kamarId,
                    alamat,
                    nomor_darurat: nomorDarurat
                }),
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.message || 'Gagal menyimpan profil')
            }

            // Refresh Zustand state
            await fetchUser()

            // Navigate to dashboard
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan sistem')
        } finally {
            setIsLoading(false)
        }
    }

    if (!user || isFetching) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Menyiapkan profil Anda...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-blue-600">
                <CardHeader className="space-y-2 text-center text-balance">
                    <CardTitle className="text-2xl font-bold">Lengkapi Profil Anda</CardTitle>
                    <CardDescription>
                        Halo <span className="font-semibold text-slate-800">{user.fullName}</span>,
                        mohon lengkapi data diri Anda sebelum masuk ke sistem ERP.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-start gap-2 border border-red-200">
                                <AlertCircle className="shrink-0 w-4 h-4 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <Input
                            label="Nomor Induk Santri (NIS)"
                            placeholder="Masukkan NIS Anda"
                            value={nomorInduk}
                            onChange={(e) => setNomorInduk(e.target.value)}
                            required
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Divisi"
                                options={divisiOptions}
                                value={divisiId}
                                onChange={(e) => setDivisiId(e.target.value)}
                                required
                            />
                            <Select
                                label="Kamar Asrama"
                                options={kamarOptions}
                                value={kamarId}
                                onChange={(e) => setKamarId(e.target.value)}
                                required
                            />
                        </div>

                        <Input
                            label="Alamat Domisili"
                            placeholder="Alamat lengkap asal daerah"
                            value={alamat}
                            onChange={(e) => setAlamat(e.target.value)}
                            required
                        />

                        <Input
                            label="Nomor HP Walisantri"
                            placeholder="Contoh: 081234567890"
                            value={nomorDarurat}
                            onChange={(e) => setNomorDarurat(e.target.value)}
                            required
                        />

                        <div className="pt-4">
                            <Button type="submit" className="w-full h-11 text-base flex items-center justify-center gap-2" isLoading={isLoading}>
                                Simpan Profil & Lanjutkan
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}