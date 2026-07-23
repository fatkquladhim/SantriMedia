import { Skeleton } from '@/components/ui/Skeleton'

export default function SettingsLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="space-y-3">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-5 w-72" />
            </div>
            <div className="grid lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 rounded-2xl" />
                    ))}
                </div>
                <div className="lg:col-span-3">
                    <Skeleton className="h-96 rounded-[40px]" />
                </div>
            </div>
        </div>
    )
}