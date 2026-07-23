import { Skeleton } from '@/components/ui/Skeleton'

export default function InventarisLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            <div className="space-y-3">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-5 w-72" />
            </div>
            <Skeleton className="h-64 rounded-[38px]" />
        </div>
    )
}