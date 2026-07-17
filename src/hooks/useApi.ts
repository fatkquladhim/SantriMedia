// src/hooks/useApi.ts
import { useState, useCallback, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

interface UseApiResponse<T> {
    data: T | null
    isLoading: boolean
    error: string | null
    fetchData: (overrideEndpoint?: string) => Promise<T | null>
    mutate: (newData: T | ((prev: T | null) => T)) => void
}

/**
 * Custom hook to handle data fetching via apiFetch wrapper.
 * Automatically manages loading and error states for CSR components.
 */
export function useApi<T = any>(
    initialEndpoint: string,
    options: { immediate?: boolean; initialData?: T } = {}
): UseApiResponse<T> {
    const { immediate = true, initialData = null } = options
    const [data, setData] = useState<T | null>(initialData)
    const [isLoading, setIsLoading] = useState<boolean>(immediate)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(
        async (overrideEndpoint?: string) => {
            setIsLoading(true)
            setError(null)
            try {
                const response = await apiFetch(overrideEndpoint || initialEndpoint)
                // All pages expect the full response object (they access `response.data` inside).
                const responseData = response;
                setData(responseData)
                return responseData
            } catch (err: any) {
                setError(err.message || 'Terjadi kesalahan sistem')
                return null
            } finally {
                setIsLoading(false)
            }
        },
        [initialEndpoint]
    )

    useEffect(() => {
        if (immediate) {
            fetchData()
        }
    }, [fetchData, immediate])

    return {
        data,
        isLoading,
        error,
        fetchData,
        mutate: (newData) => {
            setData(typeof newData === 'function' ? (newData as Function)(data) : newData)
        }
    }
}
