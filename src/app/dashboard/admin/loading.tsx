import { Skeleton } from '@/components/ui/Skeleton'

export default function AdminLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-5 w-72" />
                </div>
                <Skeleton className="h-12 w-48 rounded-2xl" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-14 flex-1 rounded-xl" />
                <Skeleton className="h-14 w-32 rounded-xl" />
            </div>
            <Skeleton className="h-96 rounded-[32px]" />
        </div>
    )
}