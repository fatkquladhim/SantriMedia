import { useState, useMemo } from 'react'
import { useApi } from '@/hooks/useApi'
import { apiFetch } from '@/lib/api'

export function useDelegasiData(scope: 'divisi' | 'platform') {
    const membersEndpoint = scope === 'divisi' ? '/users?divisi_only=true' : '/users?divisi_only=true'
    const { data: teamData, isLoading: isTeamLoading } = useApi(membersEndpoint, { immediate: true })
    const { data: tasksData, isLoading: isTasksLoading, fetchData: refreshTasks } = useApi('/tasks', { immediate: true })
    const { data: divisionsData } = useApi('/divisi', { immediate: true })
    const { data: platformsData } = useApi('/platform', { immediate: true })

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [form, setForm] = useState({
        judul: '', deskripsi: '', priority: 'medium', poin: 10,
        divisi_id: '', platform_id: '', assigned_to: '', deadline: '',
    })

    const members = teamData?.data || []
    const tasks = tasksData?.data || []
    const divisions = divisionsData?.data || (Array.isArray(divisionsData) ? divisionsData : [])
    const platforms = platformsData?.data || (Array.isArray(platformsData) ? platformsData : [])

    // Tasks assigned to a member (active)
    const memberTasksMap = useMemo(() => {
        const map: Record<string, any[]> = {}
        tasks.forEach((t: any) => {
            if (t.assigned_to) {
                if (!map[t.assigned_to]) map[t.assigned_to] = []
                map[t.assigned_to].push(t)
            }
        })
        return map
    }, [tasks])

    // Tasks with no assigned_to (uninitialized — from admin/ketua, not yet delegated)
    const unassignedTasks = useMemo(
        () => tasks.filter((t: any) => !t.assigned_to && t.status === 'todo'),
        [tasks]
    )

    const showNotif = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 3000)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await apiFetch('/tasks', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    poin: Number(form.poin),
                    divisi_id: form.divisi_id || null,
                    platform_id: form.platform_id || null,
                    assigned_to: form.assigned_to || null,
                    deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
                }),
            })
            showNotif('Tugas berhasil didelegasikan')
            setIsModalOpen(false)
            setForm({ judul: '', deskripsi: '', priority: 'medium', poin: 10, divisi_id: '', platform_id: '', assigned_to: '', deadline: '' })
            refreshTasks()
        } catch (err: any) {
            showNotif(err.message || 'Gagal membuat tugas', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const assignTask = async (taskId: string, userId: string) => {
        try {
            await apiFetch(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify({ assigned_to: userId }),
            })
            showNotif('Tugas berhasil diinisialisasikan ke anggota')
            refreshTasks()
        } catch (err: any) {
            showNotif(err.message || 'Gagal assign tugas', 'error')
        }
    }

    return {
        members, tasks, divisions, platforms, memberTasksMap, unassignedTasks,
        isTeamLoading, isTasksLoading,
        isModalOpen, setIsModalOpen,
        isSubmitting, notification,
        form, setForm,
        handleSubmit, assignTask,
    }
}
