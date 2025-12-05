import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
        sizeClasses[size],
        className
      )}
      role="status"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
}

export function SpinnerOverlay({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 dark:bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 dark:bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4">
        <Spinner size="xl" className="text-emerald-500" />
        <p className="text-white dark:text-slate-900 text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}
