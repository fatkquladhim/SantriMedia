// src/app/(auth)/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AlertCircle, Github, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [oauthLoading, setOauthLoading] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()
    const searchParams = useSearchParams()
    const { fetchUser } = useAuthStore()

    // Read error from URL params (set by OAuth callback)
    useEffect(() => {
        const errorParam = searchParams.get('error')
        if (errorParam) {
            setError(decodeURIComponent(errorParam))
            // Clean the URL
            window.history.replaceState({}, '', '/login')
        }
    }, [searchParams])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const supabase = createClient()
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            setError(authError.message)
            setIsLoading(false)
            return
        }

        // Refresh global auth store state
        await fetchUser()

        // Middleware will handle redirecting to /dashboard or /complete-profile
        router.refresh()
    }

    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        setOauthLoading(provider)
        setError(null)
        const supabase = createClient()
        
        const { error: authError } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: provider === 'google' ? {
                    access_type: 'offline',
                    prompt: 'consent',
                } : undefined,
            }
        })

        if (authError) {
            setError(authError.message)
            setOauthLoading(null)
        }
    }

    return (
        <div className="flex min-h-screen bg-[#F0FDF4] dark:bg-[#064E3B] overflow-hidden">
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
                        alt="3D Character at Desk"
                        fill
                        className="object-contain drop-shadow-2xl"
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
                            Welcome back
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            Please enter your details to sign in.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5 flex-1 w-full">
                        {error && (
                            <div className="p-3 bg-red-50/80 backdrop-blur-sm text-red-600 text-sm rounded-xl flex items-start gap-2 border border-red-200">
                                <AlertCircle className="shrink-0 w-4 h-4 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
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
                                    className="bg-white/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 focus:ring-blue-500/20 h-12 rounded-xl"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-medium rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-transparent text-slate-500">or sign in with</span>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center mb-6">
                            <button
                                type="button"
                                onClick={() => handleOAuthLogin('google')}
                                disabled={isLoading || oauthLoading !== null}
                                className="p-3 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
                            >
                                {oauthLoading === 'google' ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                                ) : (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOAuthLogin('github')}
                                disabled={isLoading || oauthLoading !== null}
                                className="p-3 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
                            >
                                {oauthLoading === 'github' ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                                ) : (
                                    <Github className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                                )}
                            </button>
                        </div>

                        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-auto pt-4">
                            By continuing you agree to Messimo's{' '}
                            <a href="#" className="underline font-medium hover:text-blue-600">Terms of Services</a> and{' '}
                            <a href="#" className="underline font-medium hover:text-blue-600">Privacy Policy</a>.
                        </p>

                        <div className="text-center text-sm mt-4">
                            <span className="text-slate-500">Don't have an account? </span>
                            <button
                                type="button"
                                onClick={() => router.push('/register')}
                                className="text-blue-600 font-semibold hover:underline"
                            >
                                Sign up
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}