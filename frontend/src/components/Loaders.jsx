export function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-[3px]' };
  return <div className={`${s[size]} border-n-700 border-t-amber-400 rounded-full anim-spin ${className}`} />;
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-3 w-1/4" />
      <div className="flex gap-2 pt-1">
        <div className="skeleton h-8 w-20 rounded-lg" />
        <div className="skeleton h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
