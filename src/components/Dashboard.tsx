'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSpanishDay, calculateWorkoutStreak } from '@/lib/utils';
import { Flame, Target, Calendar, Play, Dumbbell, BarChart3, Trophy, TrendingUp, Clock, X, Sparkles, ChevronRight, Zap, Coffee } from 'lucide-react';
import Navigation from './Navigation';
import PageTransition, { StaggerContainer, StaggerItem, ScaleCard } from './PageTransition';
import { Routine, Workout, RoutineExercise } from '@/types';
import { getExerciseById } from '@/data/exercises';
import { useRouter, usePathname } from 'next/navigation';
import { getDailyRestContent } from '@/data/rest-day-content';
import { useConfirm } from '@/hooks/useConfirm';
import ConfirmDialog from './ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import RestDayModal from './RestDayModal';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { confirm, confirmState } = useConfirm();
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [todayRoutine, setTodayRoutine] = useState<Routine | null>(null);
  const [weekWorkouts, setWeekWorkouts] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [inProgressWorkout, setInProgressWorkout] = useState<{ routineId: string; routineName: string } | null>(null);
  const [lastCompletedWorkout, setLastCompletedWorkout] = useState<Workout | null>(null);
  const [showWorkoutSummary, setShowWorkoutSummary] = useState(false);
  const [showRestDayModal, setShowRestDayModal] = useState(false);

  useEffect(() => {
    setCurrentDate(new Date());
    loadStats();
    loadTodayRoutine();
    checkInProgressWorkout();
    checkRecentWorkout();
  }, [pathname]); // Reload data when navigating to dashboard

  const checkRecentWorkout = () => {
    // Solo verificar workouts COMPLETADOS y GUARDADOS en el historial
    const workouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
    if (workouts.length === 0) return;

    const sortedWorkouts = workouts.sort((a: Workout, b: Workout) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastWorkout = sortedWorkouts[0];

    // Verificar si el último workout GUARDADO fue en las últimas 5 minutos
    // (tiempo razonable después de completar un entrenamiento)
    const lastWorkoutTime = new Date(lastWorkout.date).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (now - lastWorkoutTime < fiveMinutes) {
      // Verificar si ya fue mostrado en esta sesión
      const shownKey = `workout-summary-shown-${lastWorkout.id}`;
      if (!sessionStorage.getItem(shownKey)) {
        setLastCompletedWorkout(lastWorkout);
        setShowWorkoutSummary(true);
        sessionStorage.setItem(shownKey, 'true');
      }
    }
  };

  const dismissSummary = () => {
    setShowWorkoutSummary(false);
  };

  // Congratulations messages for workout completion
  const CONGRATULATIONS_MESSAGES = [
    { emoji: '💪', text: '¡Increíble sesión!' },
    { emoji: '🔥', text: '¡Lo lograste!' },
    { emoji: '⚡', text: '¡Entrenamiento completado!' },
    { emoji: '🏆', text: '¡Excelente trabajo!' },
    { emoji: '💯', text: '¡Trabajo perfecto!' },
    { emoji: '🎯', text: '¡Objetivo cumplido!' }
  ];

  // Recovery tips for post-workout
  const RECOVERY_TIPS = [
    { icon: '💧', title: 'Hidratación', text: 'Bebe al menos 500ml de agua en la próxima hora' },
    { icon: '🥩', title: 'Proteína', text: 'Consume 20-30g de proteína en las próximas 2 horas' },
    { icon: '🧘', title: 'Estiramiento', text: 'Dedica 5-10 minutos a estirar los músculos trabajados' },
    { icon: '😴', title: 'Descanso', text: 'Duerme 7-9 horas para una recuperación óptima' },
    { icon: '🍚', title: 'Nutrición', text: 'Come carbohidratos complejos para reponer energía' },
    { icon: '🤸', title: 'Movilidad', text: 'Realiza ejercicios de movilidad articular' },
    { icon: '❄️', title: 'Frío/Calor', text: 'Considera terapia de contraste para reducir inflamación' },
    { icon: '🚶', title: 'Recuperación Activa', text: 'Camina 10-15 minutos para mejorar circulación' }
  ];

  // Get next scheduled workout
  const getNextWorkout = () => {
    const routines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
    const today = getSpanishDay(new Date());
    const daysOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const todayIndex = daysOrder.indexOf(today);

    // Find next active routine (not rest day and not template) in the next 7 days
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (todayIndex + i) % 7;
      const nextDay = daysOrder[nextDayIndex];
      const nextRoutine = routines.find((r: Routine) =>
        r.day === nextDay && !r.isRestDay && !r.isTemplate
      );

      if (nextRoutine) {
        const daysUntil = i;
        const label = daysUntil === 1 ? 'Mañana' : nextDay;
        return { routine: nextRoutine, daysUntil, label };
      }
    }

    return null;
  };

  // Get random recovery tips
  const getRandomRecoveryTips = (count: number = 3) => {
    const shuffled = [...RECOVERY_TIPS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  // Handler to start same workout again (double session)
  const handleTrainAgain = () => {
    if (!lastCompletedWorkout) return;

    // Navigate to workout page with the same routine
    const routineId = lastCompletedWorkout.routineId;
    router.push(`/workout/${routineId}`);
    setShowWorkoutSummary(false);
  };

  const loadStats = () => {
    // ONLY read from localStorage - NO Supabase calls
    const localWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
    const localRoutines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');

    setTotalWorkouts(localWorkouts.length);

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const thisWeek = localWorkouts.filter((w: any) => {
      const workoutDate = new Date(w.date);
      return workoutDate >= startOfWeek;
    });
    setWeekWorkouts(thisWeek.length);

    const volume = localWorkouts.reduce((sum: number, w: any) => sum + (w.totalVolume || 0), 0);
    setTotalVolume(volume);

    const streak = calculateWorkoutStreak(localWorkouts, localRoutines);
    setWorkoutStreak(streak);
  };

  const loadTodayRoutine = () => {
    // ONLY read from localStorage - NO Supabase calls
    const today = getSpanishDay(new Date());
    const localRoutines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');

    // Buscar solo rutinas programadas (no plantillas)
    const scheduledForToday = localRoutines.find(
      (r: Routine) => r.day === today && !r.isTemplate
    );

    if (scheduledForToday) {
      setTodayRoutine(scheduledForToday);
      return;
    }

    // Si no hay rutina para hoy, buscar siguiente día con rutina programada
    const nextWorkout = getNextWorkout();
    if (nextWorkout) {
      // Mostrar la rutina del siguiente día
      setTodayRoutine(nextWorkout.routine);
    } else {
      setTodayRoutine(null);
    }
  };

  const checkInProgressWorkout = () => {
    // Buscar workouts en progreso en localStorage
    const keys = Object.keys(localStorage);
    const inProgressKey = keys.find(key => key.startsWith('workout-in-progress-'));

    if (inProgressKey) {
      const data = JSON.parse(localStorage.getItem(inProgressKey) || '{}');
      if (data.routineId && data.routineName) {
        // Verificar que la rutina no sea un día de descanso
        const routines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
        const routine = routines.find((r: Routine) => r.id === data.routineId);

        // Solo mostrar si la rutina existe y NO es un día de descanso
        if (routine && !routine.isRestDay) {
          setInProgressWorkout({
            routineId: data.routineId,
            routineName: data.routineName
          });
        } else {
          // Limpiar entrenamientos en progreso de días de descanso
          localStorage.removeItem(inProgressKey);
        }
      }
    }
  };

  const continueWorkout = () => {
    if (inProgressWorkout) {
      router.push(`/workout/${inProgressWorkout.routineId}`);
    }
  };

  const discardWorkout = async () => {
    if (!inProgressWorkout) return;

    const shouldDiscard = await confirm({
      title: '¿Descartar entrenamiento?',
      message: '¿Estás seguro de que quieres descartar este entrenamiento? No podrás recuperar el progreso.',
      confirmText: 'Descartar',
      cancelText: 'Cancelar',
      type: 'danger',
    });

    if (shouldDiscard) {
      const inProgressKey = `workout-in-progress-${inProgressWorkout.routineId}`;
      localStorage.removeItem(inProgressKey);
      setInProgressWorkout(null);
      toast.success('Entrenamiento descartado');
    }
  };

  const startWorkout = () => {
    if (todayRoutine) {
      router.push(`/workout/${todayRoutine.id}`);
    }
  };

  const getNextWorkoutDay = () => {
    const routines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
    const today = getSpanishDay(new Date());
    const daysOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const todayIndex = daysOrder.indexOf(today);

    // Buscar el próximo día con rutina (que no sea descanso)
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (todayIndex + i) % 7;
      const nextDay = daysOrder[nextDayIndex];
      const nextRoutine = routines.find((r: Routine) => r.day === nextDay && !r.isRestDay);

      if (nextRoutine) {
        return {
          day: nextDay,
          routine: nextRoutine,
          daysAway: i === 1 ? 'Mañana' : i === 2 ? 'Pasado mañana' : `En ${i} días`
        };
      }
    }

    return null;
  };

  const getWeekStats = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const workouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
    const routines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
    const thisWeekWorkouts = workouts.filter((w: Workout) => {
      const workoutDate = new Date(w.date);
      return workoutDate >= startOfWeek;
    });

    // Contar días de descanso programados en esta semana
    const restDays = routines.filter((r: Routine) => r.isRestDay).length;

    return {
      workoutsCompleted: thisWeekWorkouts.length,
      restDays: restDays
    };
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

            {/* Workout Streak */}
            <StaggerItem>
              <ScaleCard className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 dark:from-orange-100 dark:to-orange-50 backdrop-blur-sm border border-orange-500/30 dark:border-orange-200 rounded-xl p-4 cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10" />
                <Zap className="w-6 h-6 md:w-8 md:h-8 text-orange-500 mb-2 relative z-10" />
                <p className="text-2xl md:text-3xl font-bold text-white dark:text-orange-600 relative z-10">
                  {workoutStreak}
                </p>
                <p className="text-xs text-orange-300 dark:text-orange-600 font-medium relative z-10">
                  {workoutStreak === 1 ? 'día de racha' : 'días de racha'}
                </p>
                {workoutStreak > 0 && (
                  <div className="absolute bottom-1 right-2 text-2xl opacity-20">
                    🔥
                  </div>
                )}
              </ScaleCard>
            </StaggerItem>
          </StaggerContainer>

          {/* Today's Routine or Rest Day - Always show, independent of summary */}
          {todayRoutine && !todayRoutine.isRestDay ? (
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

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={startWorkout}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 md:py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/50"
                >
                  <Play className="w-5 h-5" />
                  Iniciar Entrenamiento
                </button>

                <button
                  onClick={() => setShowRestDayModal(true)}
                  className="w-full bg-slate-700/50 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 border border-slate-600/50 dark:border-slate-300 text-slate-300 dark:text-slate-700 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                >
                  <Coffee className="w-4 h-4" />
                  <span className="text-sm">Marcar Día de Descanso</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-100 dark:to-purple-100 backdrop-blur-sm border border-blue-500/30 dark:border-blue-300 rounded-xl p-6 md:p-8 mb-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-block bg-blue-500/10 dark:bg-blue-200 p-4 rounded-full mb-3">
                  <Calendar className="w-10 h-10 md:w-12 md:h-12 text-blue-400 dark:text-blue-600" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white dark:text-slate-900 mb-2">
                  Día de Descanso Activo
                </h3>
              </div>

              {/* Daily Content - Quote or Tip */}
              {(() => {
                const dailyContent = getDailyRestContent();
                return (
                  <div className="bg-white/10 dark:bg-white/50 backdrop-blur-sm border border-white/20 dark:border-blue-200 rounded-lg p-5 mb-6">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{dailyContent.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-blue-300 dark:text-blue-700 mb-1">
                          {dailyContent.type === 'motivation' ? 'Frase del día' : 'Consejo de recuperación'}
                        </p>
                        <p className="text-base text-white dark:text-slate-900 font-medium leading-relaxed">
                          {dailyContent.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Stats and Next Workout Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Week Stats */}
                {(() => {
                  const stats = getWeekStats();
                  return (
                    <div className="bg-white/10 dark:bg-white/50 backdrop-blur-sm border border-white/20 dark:border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-purple-400 dark:text-purple-600" />
                        <h4 className="text-sm font-bold text-white dark:text-slate-900">Esta Semana</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300 dark:text-slate-700">Entrenamientos</span>
                          <span className="font-bold text-emerald-400 dark:text-emerald-700">{stats.workoutsCompleted}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300 dark:text-slate-700">Días de descanso</span>
                          <span className="font-bold text-blue-400 dark:text-blue-700">{stats.restDays}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Next Workout */}
                {(() => {
                  const nextWorkout = getNextWorkoutDay();
                  if (!nextWorkout) return null;

                  const exercises = nextWorkout.routine.exercises.slice(0, 2);
                  const remainingCount = nextWorkout.routine.exercises.length - exercises.length;

                  return (
                    <div className="bg-white/10 dark:bg-white/50 backdrop-blur-sm border border-white/20 dark:border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ChevronRight className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
                        <h4 className="text-sm font-bold text-white dark:text-slate-900">Próximo Entrenamiento</h4>
                      </div>
                      <p className="text-sm text-slate-300 dark:text-slate-700 mb-2">
                        {nextWorkout.daysAway} • {nextWorkout.day}
                      </p>
                      <p className="text-base font-bold text-white dark:text-slate-900 mb-2">
                        {nextWorkout.routine.name}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-600 mb-2">
                        {nextWorkout.routine.exercises.length} ejercicios • ~{nextWorkout.routine.duration} min
                      </p>
                      <div className="space-y-1">
                        {exercises.map((ex: RoutineExercise) => {
                          const exercise = getExerciseById(ex.exerciseId);
                          return (
                            <p key={ex.exerciseId} className="text-xs text-slate-300 dark:text-slate-700">
                              • {exercise?.name || 'Ejercicio'}
                            </p>
                          );
                        })}
                        {remainingCount > 0 && (
                          <p className="text-xs text-slate-400 dark:text-slate-600 italic">
                            +{remainingCount} más...
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Action Button */}
              <button
                onClick={() => router.push('/routines')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-blue-500/50"
              >
                Ver Mis Rutinas
              </button>
            </div>
          )}

          {/* Workout Summary - Show AFTER routine if recently completed */}
          {showWorkoutSummary && lastCompletedWorkout && (() => {
            const randomCongrats = CONGRATULATIONS_MESSAGES[Math.floor(Math.random() * CONGRATULATIONS_MESSAGES.length)];
            const nextWorkout = getNextWorkout();
            const recoveryTips = getRandomRecoveryTips(3);

            return (
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 dark:from-emerald-100 dark:to-emerald-50 backdrop-blur-sm border-2 border-emerald-500/50 dark:border-emerald-300 rounded-xl p-6 mb-6 animate-in fade-in duration-500">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="bg-emerald-500/20 dark:bg-emerald-200 p-3 rounded-xl">
                    <Trophy className="w-8 h-8 text-emerald-400 dark:text-emerald-600 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white dark:text-slate-900 mb-1">
                      {randomCongrats.emoji} {randomCongrats.text}
                    </h3>
                    <p className="text-emerald-300 dark:text-emerald-700 text-sm font-medium">
                      {lastCompletedWorkout.routineName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismissSummary}
                  className="text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-slate-800/40 dark:bg-white rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-white dark:text-slate-900">{lastCompletedWorkout.duration}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600">minutos</p>
                </div>

                <div className="bg-slate-800/40 dark:bg-white rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Dumbbell className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-white dark:text-slate-900">{lastCompletedWorkout.exercises.length}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600">ejercicios</p>
                </div>

                <div className="bg-slate-800/40 dark:bg-white rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-white dark:text-slate-900">
                    {lastCompletedWorkout.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-600">series</p>
                </div>

                <div className="bg-slate-800/40 dark:bg-white rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-white dark:text-slate-900">
                    {lastCompletedWorkout.totalVolume || 0}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-600">kg</p>
                </div>
              </div>

              {/* RPE if available */}
              {lastCompletedWorkout.rpe && (
                <div className="bg-slate-800/40 dark:bg-white rounded-lg p-3 mb-4">
                  <p className="text-slate-400 dark:text-slate-600 text-xs mb-1">Esfuerzo Percibido (RPE)</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700/50 dark:bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${(lastCompletedWorkout.rpe / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold text-white dark:text-slate-900">
                      {lastCompletedWorkout.rpe}/10
                    </span>
                  </div>
                </div>
              )}

              {/* Next Workout Preview */}
              {nextWorkout && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-white dark:text-slate-900 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                    Próximo Entrenamiento
                  </h4>
                  <div className="bg-slate-800/40 dark:bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white dark:text-slate-900 font-medium text-sm">
                          {nextWorkout.label} - {nextWorkout.routine.day}
                        </p>
                        <p className="text-emerald-400 dark:text-emerald-600 font-bold">
                          {nextWorkout.routine.name}
                        </p>
                        <p className="text-slate-400 dark:text-slate-600 text-xs">
                          {nextWorkout.routine.exercises.length} ejercicios
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                    </div>
                  </div>
                </div>
              )}

              {/* Recovery Tips */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-white dark:text-slate-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  Tips de Recuperación
                </h4>
                <div className="space-y-2">
                  {recoveryTips.map((tip, index) => (
                    <div key={index} className="bg-slate-800/40 dark:bg-white rounded-lg p-3 flex items-start gap-2">
                      <span className="text-xl flex-shrink-0">{tip.icon}</span>
                      <div className="flex-1">
                        <p className="text-white dark:text-slate-900 font-medium text-sm">{tip.title}</p>
                        <p className="text-slate-400 dark:text-slate-600 text-xs">{tip.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleTrainAgain}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Entrenar de Nuevo
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/history')}
                    className="flex-1 bg-slate-700/50 dark:bg-slate-300 hover:bg-slate-700 dark:hover:bg-slate-400 text-white dark:text-slate-900 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    Ver Historial
                  </button>
                  <button
                    onClick={dismissSummary}
                    className="flex-1 bg-slate-700/50 dark:bg-slate-300 hover:bg-slate-700 dark:hover:bg-slate-400 text-white dark:text-slate-900 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
            );
          })()}

          {/* Quick Actions */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white dark:text-slate-900 mb-3">Accesos Rápidos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  onClick={() => router.push('/routines')}
                  className="w-full bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4 hover:border-emerald-500/50 dark:hover:border-emerald-400 transition-all"
                >
                  <Calendar className="w-6 h-6 text-emerald-500 mb-2" />
                  <p className="text-sm font-bold text-white dark:text-slate-900">Rutinas</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600">Ver todas</p>
                </button>
              </ScaleCard>

              <ScaleCard>
                <button
                  onClick={() => router.push('/routines/templates')}
                  className="w-full bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4 hover:border-yellow-500/50 dark:hover:border-yellow-400 transition-all"
                >
                  <Trophy className="w-6 h-6 text-yellow-500 mb-2" />
                  <p className="text-sm font-bold text-white dark:text-slate-900">Plantillas</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600">Predefinidas</p>
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

              <ScaleCard>
                <button
                  onClick={() => router.push('/history')}
                  className="w-full bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4 hover:border-blue-500/50 dark:hover:border-blue-400 transition-all"
                >
                  <Clock className="w-6 h-6 text-blue-500 mb-2" />
                  <p className="text-sm font-bold text-white dark:text-slate-900">Historial</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600">Sesiones</p>
                </button>
              </ScaleCard>

              <ScaleCard>
                <button
                  onClick={() => router.push('/progress')}
                  className="w-full bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4 hover:border-pink-500/50 dark:hover:border-pink-400 transition-all"
                >
                  <TrendingUp className="w-6 h-6 text-pink-500 mb-2" />
                  <p className="text-sm font-bold text-white dark:text-slate-900">Ejercicios</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600">Por ejercicio</p>
                </button>
              </ScaleCard>
            </div>
          </div>
        </div>
      </PageTransition>

      {/* Confirm Dialog */}
      <ConfirmDialog {...confirmState} />

      {/* Rest Day Modal */}
      {showRestDayModal && (
        <RestDayModal
          onClose={() => setShowRestDayModal(false)}
          onSuccess={() => {
            loadStats();
            toast.success('Día de descanso marcado correctamente');
          }}
        />
      )}
    </div>
  );
}
