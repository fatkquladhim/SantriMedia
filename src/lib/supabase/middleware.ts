// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Get user session
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Define public routes
    const publicRoutes = ['/login', '/register', '/auth/callback', '/auth/confirm']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // RULE 1: Not logged in + accessing protected route -> redirect to /login
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // RULE 2: Logged in + accessing login/register -> redirect to /dashboard
    if (user && isPublicRoute && !pathname.startsWith('/auth')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // Read profile completeness from JWT claims (injected by custom_access_token_hook)
    // Falls back to DB query if claim is missing (e.g., old tokens)
    const isProfileComplete = (user as any)?.user_metadata?.is_profile_complete ?? false;

    // RULE 3: Profile Completeness Gate
    if (user && !isPublicRoute && pathname !== '/dashboard/profile' && !pathname.startsWith('/auth')) {
        if (!isProfileComplete) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard/profile'
            return NextResponse.redirect(url)
        }
    }

    // RULE 4: Profile is complete but accessing /complete-profile (legacy) -> redirect to /dashboard
    if (user && pathname === '/complete-profile') {
        const url = request.nextUrl.clone()
        url.pathname = isProfileComplete ? '/dashboard' : '/dashboard/profile'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
