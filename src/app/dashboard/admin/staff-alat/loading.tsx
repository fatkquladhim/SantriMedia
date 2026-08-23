import { Skeleton } from '@/components/ui/Skeleton'

export default function StaffAlatLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            <div className="space-y-3">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-5 w-72" />
            </div>
            <div className="flex gap-2 pb-4 border-b border-slate-100">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-28 rounded-xl" />)}
            </div>
            <Skeleton className="h-64 rounded-[38px]" />
        </div>
    )
}
