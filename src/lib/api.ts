// src/lib/api.ts
import { createClient } from '@/lib/supabase/client';

/**
 * Custom fetch wrapper that automatically attaches the user's Supabase JWT
 * to the Authorization header when calling the backend API.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const headers = new Headers(options.headers);
    if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`);
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
