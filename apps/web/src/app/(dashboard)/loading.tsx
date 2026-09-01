export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 animate-pulse">
      {/* Page title skeleton */}
      <div className="mb-8 space-y-2">
        <div className="h-3 w-24 bg-stone-800 rounded-sm" />
        <div className="h-8 w-64 bg-stone-800 rounded-sm" />
      </div>

      {/* Filter row skeleton */}
      <div className="mb-8 flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <div key={i} className="h-7 w-20 bg-stone-800 rounded-sm" />
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <div key={i} className="space-y-3">
            <div className="aspect-[4/3] bg-stone-800 rounded-sm" />
            <div className="h-4 w-3/4 bg-stone-800 rounded-sm" />
            <div className="h-3 w-1/2 bg-stone-800 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
