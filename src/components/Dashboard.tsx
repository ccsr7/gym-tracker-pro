'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSpanishDay } from '@/lib/utils';
import { Flame, Target, Calendar, Play, Dumbbell, BarChart3 } from 'lucide-react';
import Navigation from './Navigation';
import PageTransition, { StaggerContainer, StaggerItem, ScaleCard } from './PageTransition';
import { Routine } from '@/types';
import { getExerciseById } from '@/data/exercises';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [todayRoutine, setTodayRoutine] = useState<Routine | null>(null);
  const [weekWorkouts, setWeekWorkouts] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [inProgressWorkout, setInProgressWorkout] = useState<{ routineId: string; routineName: string } | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
    loadStats();
    loadTodayRoutine();
    checkInProgressWorkout();
  }, []);

  const loadStats = () => {
    const workouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
    setTotalWorkouts(workouts.length);

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const thisWeek = workouts.filter((w: any) => {
      const workoutDate = new Date(w.date);
      return workoutDate >= startOfWeek;
    });
    setWeekWorkouts(thisWeek.length);

    // Calculate total volume
    const volume = workouts.reduce((sum: number, w: any) => sum + (w.totalVolume || 0), 0);
    setTotalVolume(volume);
  };

  const loadTodayRoutine = () => {
    const today = getSpanishDay(new Date());
    const routines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
    const routine = routines.find((r: Routine) => r.day === today);
    setTodayRoutine(routine || null);
  };

  const checkInProgressWorkout = () => {
    // Buscar workouts en progreso en localStorage
    const keys = Object.keys(localStorage);
    const inProgressKey = keys.find(key => key.startsWith('workout-in-progress-'));

    if (inProgressKey) {
      const data = JSON.parse(localStorage.getItem(inProgressKey) || '{}');
      if (data.routineId && data.routineName) {
        setInProgressWorkout({
          routineId: data.routineId,
          routineName: data.routineName
        });
      }
    }
  };

  const continueWorkout = () => {
    if (inProgressWorkout) {
      router.push(`/workout/${inProgressWorkout.routineId}`);
    }
  };

  const discardWorkout = () => {
    if (inProgressWorkout && confirm('¿Estás seguro de que quieres descartar este entrenamiento?')) {
      const inProgressKey = `workout-in-progress-${inProgressWorkout.routineId}`;
      localStorage.removeItem(inProgressKey);
      setInProgressWorkout(null);
    }
  };

  const startWorkout = () => {
    if (todayRoutine) {
      router.push(`/workout/${todayRoutine.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <PageTransition>
        <div className="container mx-auto px-4 pt-20 py-6 pb-24 md:pt-8 md:py-8">
          {/* Compact Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white dark:text-slate-900">
              Hola, {user?.name} 👋
            </h1>
          </div>

          {/* In-Progress Workout Banner */}
          {inProgressWorkout && (
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 dark:from-orange-100 dark:to-orange-50 backdrop-blur-sm border-2 border-orange-500/50 dark:border-orange-300 rounded-xl p-4 mb-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/20 dark:bg-orange-200 p-2 rounded-lg">
                    <Play className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-white dark:text-slate-900 font-bold">Entrenamiento en progreso</h3>
                    <p className="text-orange-300 dark:text-orange-700 text-sm">{inProgressWorkout.routineName}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={continueWorkout}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    Continuar
                  </button>
                  <button
                    onClick={discardWorkout}
                    className="bg-slate-700/50 dark:bg-slate-300 hover:bg-slate-700 dark:hover:bg-slate-400 text-white dark:text-slate-900 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid - Compacto en mobile */}
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {/* Weekly Workouts */}
            <StaggerItem>
              <ScaleCard
                onClick={() => router.push('/history')}
                className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 dark:from-emerald-100 dark:to-emerald-50 backdrop-blur-sm border border-emerald-500/30 dark:border-emerald-200 rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 dark:hover:border-emerald-400 transition-all"
              >
                <Flame className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 mb-2" />
                <p className="text-2xl md:text-3xl font-bold text-white dark:text-emerald-600">{weekWorkouts}</p>
                <p className="text-xs text-emerald-300 dark:text-emerald-600 font-medium">Esta semana</p>
              </ScaleCard>
            </StaggerItem>

            {/* Total Workouts */}
            <StaggerItem>
              <ScaleCard
                onClick={() => router.push('/history')}
                className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 dark:from-blue-100 dark:to-blue-50 backdrop-blur-sm border border-blue-500/30 dark:border-blue-200 rounded-xl p-4 cursor-pointer hover:border-blue-500/50 dark:hover:border-blue-400 transition-all"
              >
                <Target className="w-6 h-6 md:w-8 md:h-8 text-blue-500 mb-2" />
                <p className="text-2xl md:text-3xl font-bold text-white dark:text-blue-600">{totalWorkouts}</p>
                <p className="text-xs text-blue-300 dark:text-blue-600 font-medium">Total sesiones</p>
              </ScaleCard>
            </StaggerItem>

            {/* Total Volume */}
            <StaggerItem>
              <ScaleCard className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 dark:from-purple-100 dark:to-purple-50 backdrop-blur-sm border border-purple-500/30 dark:border-purple-200 rounded-xl p-4 cursor-pointer">
                <Dumbbell className="w-6 h-6 md:w-8 md:h-8 text-purple-500 mb-2" />
                <p className="text-2xl md:text-3xl font-bold text-white dark:text-purple-600">
                  {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
                </p>
                <p className="text-xs text-purple-300 dark:text-purple-600 font-medium">kg levantados</p>
              </ScaleCard>
            </StaggerItem>

            {/* Today */}
            <StaggerItem>
              <ScaleCard className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 dark:from-orange-100 dark:to-orange-50 backdrop-blur-sm border border-orange-500/30 dark:border-orange-200 rounded-xl p-4 cursor-pointer">
                <Calendar className="w-6 h-6 md:w-8 md:h-8 text-orange-500 mb-2" />
                <p className="text-xl md:text-2xl font-bold text-white dark:text-orange-600">
                  {getSpanishDay(currentDate)}
                </p>
                <p className="text-xs text-orange-300 dark:text-orange-600 font-medium">
                  {currentDate.toLocaleDateString('es-ES', { month: 'long' }).charAt(0).toUpperCase() + currentDate.toLocaleDateString('es-ES', { month: 'long' }).slice(1)} {currentDate.getDate()}
                </p>
              </ScaleCard>
            </StaggerItem>
          </StaggerContainer>

          {/* Today's Routine */}
          {todayRoutine ? (
            <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4 md:p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-lg md:text-xl font-bold text-white dark:text-slate-900 flex items-center gap-2 mb-1">
                    <Flame className="w-5 h-5 text-emerald-500" />
                    {todayRoutine.name}
                  </h2>
                  <p className="text-sm text-slate-400 dark:text-slate-600">Rutina para {todayRoutine.day}</p>
                </div>
              </div>

              {/* Compact Stats */}
              <div className="flex flex-wrap gap-3 text-xs text-slate-400 dark:text-slate-600 mb-4">
                <span className="flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5" />
                  {todayRoutine.exercises.length} ejercicios
                </span>
                <span className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  {todayRoutine.exercises.reduce((acc, ex) => acc + ex.sets, 0)} series
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  ~{todayRoutine.duration} min
                </span>
              </div>

              {/* Exercise List - Simplified */}
              <div className="space-y-2 mb-4">
                {todayRoutine.exercises.slice(0, 4).map((routineEx, index) => {
                  const exercise = getExerciseById(routineEx.exerciseId);
                  if (!exercise) return null;

                  return (
                    <div
                      key={index}
                      className="bg-slate-700/30 dark:bg-white border border-slate-600/50 dark:border-slate-300 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="bg-emerald-500/20 text-emerald-400 dark:text-emerald-600 text-xs font-bold px-2 py-1 rounded flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium text-white dark:text-slate-900 truncate">{exercise.name}</h3>
                          <p className="text-xs text-slate-400 dark:text-slate-600">
                            {routineEx.sets} × {routineEx.reps}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {todayRoutine.exercises.length > 4 && (
                  <p className="text-xs text-center text-slate-400 dark:text-slate-600">
                    +{todayRoutine.exercises.length - 4} ejercicios más
                  </p>
                )}
              </div>

              {/* Start Button */}
              <button
                onClick={startWorkout}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 md:py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/50"
              >
                <Play className="w-5 h-5" />
                Iniciar Entrenamiento
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-8 md:p-12 text-center mb-6">
              <Calendar className="w-12 h-12 md:w-16 md:h-16 text-purple-500 mx-auto mb-3" />
              <h3 className="text-xl md:text-2xl font-bold text-white dark:text-slate-900 mb-2">Día de Descanso</h3>
              <p className="text-sm text-slate-400 dark:text-slate-600 mb-4">
                No hay entrenamientos hoy. ¡Recupérate!
              </p>
              <button
                onClick={() => router.push('/routines')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Ver Mis Rutinas
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <ScaleCard>
              <button
                onClick={() => router.push('/library')}
                className="w-full bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4 hover:border-purple-500/50 dark:hover:border-purple-400 transition-all"
              >
                <Dumbbell className="w-6 h-6 text-purple-500 mb-2" />
                <p className="text-sm font-bold text-white dark:text-slate-900">Biblioteca</p>
                <p className="text-xs text-slate-400 dark:text-slate-600">Ejercicios</p>
              </button>
            </ScaleCard>

            <ScaleCard>
              <button
                onClick={() => router.push('/stats')}
                className="w-full bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4 hover:border-indigo-500/50 dark:hover:border-indigo-400 transition-all"
              >
                <BarChart3 className="w-6 h-6 text-indigo-500 mb-2" />
                <p className="text-sm font-bold text-white dark:text-slate-900">Estadísticas</p>
                <p className="text-xs text-slate-400 dark:text-slate-600">Progreso</p>
              </button>
            </ScaleCard>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
