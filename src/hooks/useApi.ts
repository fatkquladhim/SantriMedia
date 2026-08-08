// src/hooks/useApi.ts
import { useState, useCallback, useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/api'

interface UseApiResponse<T> {
    data: T | null
    isLoading: boolean
    error: string | null
    fetchData: (overrideEndpoint?: string) => Promise<T | null>
    mutate: (newData: T | ((prev: T | null) => T)) => void
}

// ===== Module-level In-Memory Cache =====
// Stored outside React so data survives component unmount/remount (navigation).
// This is the core fix: navigating away and back no longer triggers a full reload.
interface CacheEntry {
    data: unknown
    fetchedAt: number
    inFlight: Promise<unknown> | null
}

const CACHE_TTL_MS = 60_000       // 60s: serve from cache, no network call
const STALE_TTL_MS = 300_000      // 5min: serve stale data immediately, revalidate in background

const apiCache = new Map<string, CacheEntry>()

/** Manually invalidate one or all cache entries. Call after mutations. */
export function invalidateCache(endpoint?: string) {
    if (endpoint) {
        apiCache.delete(endpoint)
    } else {
        apiCache.clear()
    }
}

/**
 * Custom hook to handle data fetching via apiFetch wrapper.
 * Strategy: cache-first with stale-while-revalidate.
 * - Fresh (< 60s): return cache, no network call
 * - Stale (60s–5min): return cache immediately, revalidate in background
 * - Expired (> 5min): show loading, fetch, then render
 */
export function useApi<T = any>(
    initialEndpoint: string,
    options: { immediate?: boolean; initialData?: T } = {}
): UseApiResponse<T> {
    const { immediate = true, initialData = null } = options

    // Seed state from cache synchronously so there is no flash of empty content
    const getCachedData = (): T | null => {
        const entry = apiCache.get(initialEndpoint)
        if (!entry) return initialData ?? null
        const age = Date.now() - entry.fetchedAt
        return age < STALE_TTL_MS ? (entry.data as T) : (initialData ?? null)
    }

    const [data, setData] = useState<T | null>(getCachedData)
    const [isLoading, setIsLoading] = useState<boolean>(() => {
        if (!immediate) return false
        const entry = apiCache.get(initialEndpoint)
        if (!entry) return true
        // If cache is fresh or stale, no loading needed (data already seeded)
        if (Date.now() - entry.fetchedAt < STALE_TTL_MS) return false
        // Cache is expired - need to fetch but don't block UI
        return false
    })
    const [error, setError] = useState<string | null>(null)
    const mountedRef = useRef(true)

    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    const fetchData = useCallback(
        async (overrideEndpoint?: string): Promise<T | null> => {
            const endpoint = overrideEndpoint || initialEndpoint

            // Deduplicate: if a request for this endpoint is already in-flight, await it
            const existing = apiCache.get(endpoint)
            if (existing?.inFlight) {
                try {
                    const result = await existing.inFlight
                    if (mountedRef.current) setData(result as T)
                    return result as T
                } catch {
                    return null
                }
            }

            if (mountedRef.current) {
                setIsLoading(true)
                setError(null)
            }

            const request = apiFetch(endpoint)

            // Store the in-flight promise so concurrent callers can share it
            apiCache.set(endpoint, { data: existing?.data ?? null, fetchedAt: existing?.fetchedAt ?? 0, inFlight: request })

            try {
                const response = await request
                apiCache.set(endpoint, { data: response, fetchedAt: Date.now(), inFlight: null })
                if (mountedRef.current) setData(response as T)
                return response as T
            } catch (err: any) {
                apiCache.set(endpoint, { ...(apiCache.get(endpoint)!), inFlight: null })
                if (mountedRef.current) setError(err.message || 'Terjadi kesalahan sistem')
                return null
            } finally {
                if (mountedRef.current) setIsLoading(false)
            }
        },
        [initialEndpoint]
    )

    useEffect(() => {
        if (!immediate) return

        const entry = apiCache.get(initialEndpoint)
        const age = entry ? Date.now() - entry.fetchedAt : Infinity

        if (age < CACHE_TTL_MS) {
            // Fresh — nothing to do, state already seeded from cache above
            return
        }

        if (age < STALE_TTL_MS) {
            // Stale — show cached data immediately, revalidate silently in background
            // (setIsLoading stays false, no spinner)
            fetchData()
            return
        }

        // Expired or no cache — full fetch with loading spinner
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialEndpoint, immediate])

    return {
        data,
        isLoading,
        error,
        fetchData,
        mutate: (newData) => {
            const resolved = typeof newData === 'function' ? (newData as Function)(data) : newData
            setData(resolved)
            // Keep cache in sync with optimistic updates
            const entry = apiCache.get(initialEndpoint)
            if (entry) {
                apiCache.set(initialEndpoint, { ...entry, data: resolved })
            }
        }
    }
}
