import { Skeleton } from '@/components/ui/Skeleton'

export default function ProfileLoading() {
    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col lg:flex-row items-center gap-8">
                <Skeleton className="w-44 h-44 rounded-[60px]" />
                <div className="flex-1 space-y-4">
                    <Skeleton className="h-12 w-64" />
                    <Skeleton className="h-5 w-full max-w-xl" />
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-[40px]" />
                ))}
            </div>
        </div>
    )
}