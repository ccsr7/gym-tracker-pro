import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-700/50 dark:bg-slate-300/50',
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl p-6 bg-slate-800/50 dark:bg-white/50 border border-slate-700/50 dark:border-slate-200">
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonRoutineCard() {
  return (
    <div className="rounded-xl p-6 bg-slate-800/50 dark:bg-white/50 border border-slate-700/50 dark:border-slate-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

export function SkeletonWorkoutCard() {
  return (
    <div className="rounded-xl p-6 bg-slate-800/50 dark:bg-white/50 border border-slate-700/50 dark:border-slate-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>

      <Skeleton className="h-4 w-full" />
    </div>
  );
}

export function SkeletonExerciseList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-lg p-4 bg-slate-800/30 dark:bg-white/30 border border-slate-700/30 dark:border-slate-200/30"
        >
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-xl p-6 bg-slate-800/50 dark:bg-white/50 border border-slate-700/50 dark:border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
