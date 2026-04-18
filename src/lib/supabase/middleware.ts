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

    // RULE 3: Profile Completeness Gate
    if (user && !isPublicRoute && pathname !== '/complete-profile' && !pathname.startsWith('/auth')) {
        // Check profile completeness from database
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_profile_complete')
            .eq('id', user.id)
            .single()

        // Redirect if profile doesn't exist yet OR exists but marked incomplete
        if (!profile || !profile.is_profile_complete) {
            const url = request.nextUrl.clone()
            url.pathname = '/complete-profile'
            return NextResponse.redirect(url)
        }
    }

    // RULE 4: Profile is complete but accessing /complete-profile -> redirect to /dashboard
    if (user && pathname === '/complete-profile') {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_profile_complete')
            .eq('id', user.id)
            .single()

        if (profile?.is_profile_complete) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
