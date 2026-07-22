// src/lib/api.ts
import { createClient } from '@/lib/supabase/client';

// ===== Session Cache =====
// Supabase getSession() adds ~50-100ms per call. We cache it for 50s
// (well within the 1hr token lifetime) to avoid redundant round-trips.
let _sessionCache: { token: string; expiresAt: number } | null = null;

async function getCachedToken(): Promise<string | null> {
    const now = Date.now();
    if (_sessionCache && now < _sessionCache.expiresAt) {
        return _sessionCache.token;
    }
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        _sessionCache = null;
        return null;
    }
    _sessionCache = { token: session.access_token, expiresAt: now + 50_000 };
    return _sessionCache.token;
}

/** Call this on logout to clear the cached session token. */
export function clearSessionCache() {
    _sessionCache = null;
}

/**
 * Custom fetch wrapper that automatically attaches the user's Supabase JWT
 * to the Authorization header when calling the backend API.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = await getCachedToken();

    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Set default content type if not provided
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    // Ensure endpoint starts with a slash
    const url = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // If 401, token may have been rotated — clear cache and retry once
    if (response.status === 401) {
        _sessionCache = null;
        const freshToken = await getCachedToken();
        if (freshToken) {
            headers.set('Authorization', `Bearer ${freshToken}`);
            const retryResponse = await fetch(url, { ...options, headers });
            const retryData = await retryResponse.json().catch(() => null);
            if (!retryResponse.ok) {
                throw {
                    status: retryResponse.status,
                    message: retryData?.message || retryResponse.statusText,
                    errors: retryData?.errors,
                };
            }
            return retryData;
        }
        // No fresh token available — session truly expired, throw so callers can redirect
        throw {
            status: 401,
            message: 'Sesi Anda telah berakhir. Silakan login kembali.',
        };
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw {
            status: response.status,
            message: data?.message || response.statusText,
            errors: data?.errors,
        };
    }

    return data;
}
