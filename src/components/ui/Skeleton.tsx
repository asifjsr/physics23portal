import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Skeleton */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass p-5 h-28">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40 mt-3" />
          </div>
        ))}
      </section>

      {/* Main Content Skeleton */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-6">
        <div className="flex flex-col gap-6">
          <div className="glass p-6 h-[400px]">
            <div className="flex justify-between mb-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
          <div className="glass p-6 h-60">
            <Skeleton className="h-6 w-40 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Skeleton className="glass p-6 h-80 w-full" />
          <Skeleton className="glass p-6 h-40 w-full" />
        </div>
      </section>

      {/* Calendar Skeleton */}
      <div className="glass p-6 h-[600px]">
        <div className="flex justify-between mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-7 gap-px h-[450px]">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-full w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}
