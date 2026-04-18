// src/app/auth/callback/route.ts
// Handle OAuth callback — exchange auth code for session
// Reference: Supabase Context7 docs — PKCE OAuth callback
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // If "next" is in param, use it as the redirect URL
    let next = searchParams.get('next') ?? '/dashboard'
    if (!next.startsWith('/')) {
        next = '/dashboard'
    }

    // Handle error from OAuth provider (e.g. user denied access)
    if (errorParam) {
        const errorMsg = errorDescription || errorParam
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent(errorMsg)}`
        )
    }

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                // No load balancer in local dev
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }

        console.error('Auth callback error:', error.message)
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent(error.message)}`
        )
    }

    // No code provided — redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
