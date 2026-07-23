import { Skeleton } from '@/components/ui/Skeleton'

export default function TasksLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            <div className="space-y-3">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-5 w-72" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-10 w-32 rounded-xl" />
                <Skeleton className="h-10 flex-1 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-2xl" />
                ))}
            </div>
        </div>
    )
}