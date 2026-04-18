// src/app/(auth)/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const router = useRouter()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const supabase = createClient()
        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
        })

        if (authError) {
            setError(authError.message)
            setIsLoading(false)
            return
        }

        setSuccess(true)
        setIsLoading(false)
    }

    // Success State View
    if (success) {
        return (
            <div className="flex min-h-screen bg-[#F0FDF4] dark:bg-[#064E3B] overflow-hidden">
                {/* Left Side Visual (Condensed) */}
                <div className="hidden lg:flex lg:w-1/3 relative items-center justify-center p-12">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-sky-100/50 dark:from-blue-900/50 dark:to-sky-900/50" />
                    <div className="relative z-10 w-full max-w-sm aspect-square">
                        <Image
                            src="/illustration.png"
                            alt="Success Illustration"
                            fill
                            className="object-contain drop-shadow-2xl animate-float"
                            priority
                        />
                    </div>
                </div>

                {/* Right Side - Success Content */}
                <div className="flex flex-1 items-center justify-center p-6 relative z-10">
                    <div className="w-full max-w-md glass-panel dark:bg-black/30 bg-white/70 p-10 rounded-3xl shadow-xl text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-6 text-blue-600 shadow-lg shadow-blue-200/50">
                            <CheckCircle2 size={40} strokeWidth={2} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                            Registrasi Berhasil
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">
                            Kami telah mengirim link verifikasi ke <br />
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>.
                            <br />Silakan periksa inbox Anda.
                        </p>
                        <Button
                            onClick={() => router.push('/login')}
                            className="w-full h-12 text-base font-medium rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                        >
                            Kembali ke Login
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // Main Registration View
    return (
        <div className="flex min-h-screen bg-[#F0FDF4] dark:bg-[#064E3B] overflow-hidden">
            {/* CSS for animations */}
            <style jsx global>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
                .animate-float { animation: float 6s ease-in-out infinite; }
            `}</style>

            {/* Left Column - Visual/Illustration */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-sky-100/50 dark:from-blue-900/50 dark:to-sky-900/50" />

                {/* Decorative floating shapes */}
                <div className="absolute top-20 left-20 w-32 h-32 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob" />
                <div className="absolute top-40 right-20 w-32 h-32 bg-sky-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-40 w-32 h-32 bg-green-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-4000" />

                <div className="relative z-10 w-full max-w-lg aspect-square">
                    <Image
                        src="/illustration.png"
                        alt="3D Character Illustration"
                        fill
                        className="object-contain drop-shadow-2xl animate-float" // Added float animation
                        priority
                    />
                </div>
            </div>

            {/* Right Column - Auth Form */}
            <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 relative z-10">
                {/* Glassmorphic Panel */}
                <div className="w-full max-w-[440px] glass-panel dark:bg-black/30 bg-white/70 p-8 sm:p-10 rounded-3xl shadow-xl flex flex-col relative overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <span className="text-xl font-bold text-white">E</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                            messimo
                        </h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-semibold text-slate-900 dark:text-white mb-2">
                            Create an account
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            Start your 30-day free trial.
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5 flex-1 w-full">
                        {error && (
                            <div className="p-3 bg-red-50/80 backdrop-blur-sm text-red-600 text-sm rounded-xl flex items-start gap-2 border border-red-200">
                                <AlertCircle className="shrink-0 w-4 h-4 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                                    Full Name
                                </label>
                                <Input
                                    placeholder="M Fulan"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="bg-white/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 focus:ring-blue-500/20 h-12 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                                    Email address
                                </label>
                                <Input
                                    type="email"
                                    placeholder="name@pesantren.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-white/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 focus:ring-blue-500/20 h-12 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                                    Password
                                </label>
                                <Input
                                    type="password"
                                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="bg-white/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 focus:ring-blue-500/20 h-12 rounded-xl"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-medium rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating account...' : 'Get started'}
                        </Button>

                        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4 pt-4">
                            By continuing you agree to Messimo's{' '}
                            <a href="#" className="underline font-medium hover:text-blue-600">Terms of Services</a> and{' '}
                            <a href="#" className="underline font-medium hover:text-blue-600">Privacy Policy</a>.
                        </p>

                        <div className="text-center text-sm mt-2">
                            <span className="text-slate-500">Already have an account? </span>
                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="text-blue-600 font-semibold hover:underline"
                            >
                                Sign in
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}