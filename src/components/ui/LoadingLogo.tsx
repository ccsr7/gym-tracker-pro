import { Dumbbell } from 'lucide-react';

interface LoadingLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spin' | 'pulse' | 'bounce' | 'lift';
  className?: string;
}

export default function LoadingLogo({
  size = 'md',
  variant = 'lift',
  className = ''
}: LoadingLogoProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const animations = {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    lift: 'animate-lift'
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <Dumbbell
        className={`${sizeClasses[size]} ${animations[variant]} text-emerald-500`}
      />
      <style jsx>{`
        @keyframes lift {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-4px) rotate(-5deg);
          }
          50% {
            transform: translateY(-8px) rotate(0deg);
          }
          75% {
            transform: translateY(-4px) rotate(5deg);
          }
        }

        :global(.animate-lift) {
          animation: lift 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
