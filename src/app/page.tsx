'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Dashboard from '@/components/Dashboard';
import Login from '@/components/Login';
import OnboardingModal from '@/components/OnboardingModal';
import { TrainingGoal } from '@/types';

export default function Home() {
  const { isAuthenticated, isLoading, user, updateUser } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and doesn't have a training goal set
    if (isAuthenticated && user && !user.trainingGoal) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, user]);

  const handleOnboardingComplete = (goal: TrainingGoal) => {
    updateUser({ trainingGoal: goal });
    setShowOnboarding(false);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400 dark:text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <>
      <Dashboard />
      {showOnboarding && user && (
        <OnboardingModal
          userName={user.name}
          onComplete={handleOnboardingComplete}
        />
      )}
    </>
  );
}
