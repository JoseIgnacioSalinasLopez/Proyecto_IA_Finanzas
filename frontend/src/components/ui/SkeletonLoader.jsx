export function CardSkeleton() {
    return (
        <div className="card animate-pulse flex items-center gap-4 p-5 bg-white/5 border-white/5">
            <div className="w-14 h-14 rounded-2xl skeleton-shimmer skeleton flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-20 rounded skeleton skeleton-shimmer" />
                <div className="h-7 w-32 rounded skeleton skeleton-shimmer" />
            </div>
        </div>
    );
}

export function ListSkeleton({ count = 3 }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 card animate-pulse bg-white/5 border-white/5">
                    <div className="w-12 h-12 rounded-full skeleton-shimmer skeleton flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 rounded skeleton skeleton-shimmer" />
                        <div className="h-3 w-1/4 rounded skeleton skeleton-shimmer" />
                    </div>
                    <div className="h-5 w-16 rounded skeleton skeleton-shimmer" />
                </div>
            ))}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in w-full">
            <div className="space-y-2">
                <div className="h-8 w-64 rounded skeleton skeleton-shimmer" />
                <div className="h-4 w-40 rounded skeleton skeleton-shimmer" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
            <div className="h-64 rounded-3xl skeleton skeleton-shimmer bg-white/5" />
            <div className="h-48 rounded-3xl skeleton skeleton-shimmer bg-white/5" />
        </div>
    );
}

export function GridCardSkeleton({ count = 6 }) {
    return (
        <div className="space-y-6 w-full animate-fade-in">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-8 w-40 rounded skeleton skeleton-shimmer bg-white/5" />
                    <div className="h-4 w-24 rounded skeleton skeleton-shimmer bg-white/5" />
                </div>
                <div className="h-10 w-32 rounded-xl skeleton skeleton-shimmer bg-white/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="card p-6 min-h-[160px] animate-pulse bg-white/5 border-white/5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl skeleton skeleton-shimmer bg-white/10" />
                            <div className="h-6 w-20 rounded-lg skeleton skeleton-shimmer bg-white/10" />
                        </div>
                        <div className="space-y-4">
                            <div className="h-4 w-3/4 rounded skeleton skeleton-shimmer" />
                            <div className="h-2 w-full rounded-full skeleton skeleton-shimmer bg-white/10" />
                            <div className="flex justify-between">
                                <div className="h-3 w-1/4 rounded skeleton skeleton-shimmer" />
                                <div className="h-3 w-1/4 rounded skeleton skeleton-shimmer" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
