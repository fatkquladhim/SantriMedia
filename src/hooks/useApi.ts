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
    const [data, setData] = useState<T | null>(options.initialData ?? null)
    const [isLoading, setIsLoading] = useState<boolean>(options.immediate ?? true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(
        async (overrideEndpoint?: string) => {
            setIsLoading(true)
            setError(null)
            try {
                const response = await apiFetch(overrideEndpoint || initialEndpoint)
                // Express backend wrapper returns data inside `data`
                // Only strip `data` if it's not a paginated response (to keep pagination metadata)
                const responseData = (response.data !== undefined && !response.pagination) ? response.data : response
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
        if (options.immediate) {
            fetchData()
        }
    }, [fetchData, options.immediate])

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
