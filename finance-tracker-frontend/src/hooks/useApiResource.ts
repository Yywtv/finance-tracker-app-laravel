import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../lib/api'

export function useApiResource<T>(path: string | null) {
    const [data, setData] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState(Boolean(path))
    const [error, setError] = useState<unknown>(null)
    const requestId = useRef(0)

    const load = useCallback(async () => {
        const currentRequest = ++requestId.current

        if (!path) {
            setData(null)
            setError(null)
            setIsLoading(false)
            return null
        }

        setIsLoading(true)
        setError(null)

        try {
            const result = await apiRequest<T>(path)
            if (currentRequest === requestId.current) setData(result)
            return result
        } catch (loadError) {
            if (currentRequest === requestId.current) setError(loadError)
            return null
        } finally {
            if (currentRequest === requestId.current) setIsLoading(false)
        }
    }, [path])

    useEffect(() => {
        void load()
    }, [load])

    return {
        data,
        isLoading,
        error,
        reload: load,
        setData,
    }
}
