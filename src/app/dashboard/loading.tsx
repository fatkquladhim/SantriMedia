import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
    return (
        <div className="space-y-10 animate-in fade-in duration-300 pb-20">
            <div className="space-y-3">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-5 w-96" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-[38px]" />
                ))}
            </div>
            <Skeleton className="h-96 rounded-[38px]" />
        </div>
    )
}