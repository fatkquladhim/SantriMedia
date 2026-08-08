'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminUsersRedirect() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/dashboard/admin/access')
    }, [router])

    return null
}
