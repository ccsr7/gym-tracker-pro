'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import PageTransition from '@/components/PageTransition';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/useToast';
import { calculateBMI, getBMICategory } from '@/lib/utils';
import { User as UserIcon, Scale, Ruler, Activity, LogOut, Edit, Calendar, Clock, Dumbbell, TrendingUp, History, Database } from 'lucide-react';
import { Workout } from '@/types';
import { getExerciseById } from '@/data/exercises';
import { getWorkouts, getWorkoutsByDateRange } from '@/lib/supabase/services';
import { supabase } from '@/lib/supabase/client';
import MigrationModal from '@/components/MigrationModal';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [trainingGoal, setTrainingGoal] = useState<'strength' | 'hypertrophy' | 'endurance'>('hypertrophy');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [thisWeekWorkouts, setThisWeekWorkouts] = useState(0);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setWeight(user.weight?.toString() || '');
      setHeight(user.height?.toString() || '');
      setTrainingGoal(user.trainingGoal || 'hypertrophy');
    }
    loadWorkoutHistory();
  }, [user]);

  // Setup Realtime subscription for workouts
  useRealtimeSubscription({
    table: 'workouts',
    event: '*',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onChange: (payload) => {
      console.log('[Profile] Workouts changed:', payload.eventType);
      loadWorkoutHistory();
    },
  });

  const checkUnsyncedData = async () => {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (!supabaseUser) return;

      const localWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
      const { data } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', supabaseUser.id);

      const supabaseCount = data?.length || 0;
      const localCount = localWorkouts.length;

      setUnsyncedCount(Math.max(0, localCount - supabaseCount));
    } catch (error) {
      console.error('[Profile] Error checking unsynced data:', error);
    }
  };

  const loadWorkoutHistory = async () => {
    try {
      // Get current user ID from Supabase
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (!supabaseUser) {
        // If not logged in with Supabase, fallback to localStorage (for migration period)
        setUserId(null);
        loadWorkoutHistoryFromLocalStorage();
        return;
      }

      // Set userId for Realtime subscription
      setUserId(supabaseUser.id);

      // Check for unsynced data
      checkUnsyncedData();

      // Load workouts from Supabase
      const allWorkouts = await getWorkouts(supabaseUser.id);

      setWorkouts(allWorkouts.slice(0, 5)); // Últimos 5 entrenamientos
      setTotalWorkouts(allWorkouts.length);

      // Calcular volumen total
      const volume = allWorkouts.reduce((sum: number, w: Workout) => sum + (w.totalVolume || 0), 0);
      setTotalVolume(volume);

      // Calcular entrenamientos de esta semana
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(today);
      endOfWeek.setHours(23, 59, 59, 999);

      const thisWeekWorkouts = await getWorkoutsByDateRange(supabaseUser.id, startOfWeek, endOfWeek);
      setThisWeekWorkouts(thisWeekWorkouts.length);
    } catch (error) {
      console.error('[Profile] Error loading workout history:', error);
      toast.error('Error al cargar historial de entrenamientos');
    }
  };

  // Fallback function for localStorage (migration period)
  const loadWorkoutHistoryFromLocalStorage = () => {
    const storedWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
    const sortedWorkouts = storedWorkouts.sort((a: Workout, b: Workout) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setWorkouts(sortedWorkouts.slice(0, 5));
    setTotalWorkouts(storedWorkouts.length);

    const volume = storedWorkouts.reduce((sum: number, w: Workout) => sum + (w.totalVolume || 0), 0);
    setTotalVolume(volume);

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const thisWeek = storedWorkouts.filter((w: Workout) => {
      const workoutDate = new Date(w.date);
      return workoutDate >= startOfWeek;
    });
    setThisWeekWorkouts(thisWeek.length);
  };

  const handleSave = () => {
    updateUser({
      name,
      email,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
      trainingGoal,
    });
    setIsEditing(false);
    toast.success('Perfil actualizado correctamente');
  };

  const handleLogout = () => {
    logout();
    toast.info('Sesión cerrada');
    router.push('/');
  };

  const bmi = user?.weight && user?.height ? calculateBMI(user.weight, user.height) : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <PageTransition>
        <div className="container mx-auto px-4 pt-20 py-8 pb-24 md:pt-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white dark:text-slate-900">Mi Perfil</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-transparent hover:bg-white/5 dark:hover:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors border border-slate-700 dark:border-slate-300"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>

        {/* Personal Information */}
        <div className="bg-slate-800/60 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-700/50 dark:bg-slate-200 p-2 rounded-lg">
              <UserIcon className="w-5 h-5 text-slate-300 dark:text-slate-700" />
            </div>
            <h2 className="text-lg font-bold text-white dark:text-slate-900">Información Personal</h2>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 dark:text-slate-600 mb-2">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 dark:text-slate-600 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 dark:text-slate-600 text-sm mb-1">Nombre</p>
                <p className="text-white dark:text-slate-900 font-medium text-lg">{user?.name || 'Usuario'}</p>
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-600 text-sm mb-1">Email</p>
                <p className="text-white dark:text-slate-900 font-medium">{user?.email || ''}</p>
              </div>
            </div>
          )}
        </div>

        {/* Physical Data */}
        <div className="bg-slate-800/60 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-700/50 dark:bg-slate-200 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-slate-300 dark:text-slate-700" />
            </div>
            <h2 className="text-lg font-bold text-white dark:text-slate-900">Datos Físicos</h2>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 dark:text-slate-600 mb-2">
                  <Scale className="w-4 h-4 inline mr-1" />
                  Peso (kg)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value.replace(',', '.'))}
                  className="w-full px-4 py-3 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 dark:text-slate-600 mb-2">
                  <Ruler className="w-4 h-4 inline mr-1" />
                  Estatura (cm)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  step="1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 dark:text-slate-600 mb-2">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Objetivo de Entrenamiento
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setTrainingGoal('strength')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      trainingGoal === 'strength'
                        ? 'border-blue-500 bg-blue-500/20 dark:bg-blue-100'
                        : 'border-slate-600 dark:border-slate-300 bg-slate-700/30 dark:bg-slate-50 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💪</span>
                      <div>
                        <p className={`font-bold ${trainingGoal === 'strength' ? 'text-blue-400 dark:text-blue-600' : 'text-white dark:text-slate-900'}`}>
                          Fuerza
                        </p>
                        <p className="text-sm text-slate-400 dark:text-slate-600">1-6 reps • Cargas pesadas • 3-5 min descanso</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrainingGoal('hypertrophy')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      trainingGoal === 'hypertrophy'
                        ? 'border-purple-500 bg-purple-500/20 dark:bg-purple-100'
                        : 'border-slate-600 dark:border-slate-300 bg-slate-700/30 dark:bg-slate-50 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏋️</span>
                      <div>
                        <p className={`font-bold ${trainingGoal === 'hypertrophy' ? 'text-purple-400 dark:text-purple-600' : 'text-white dark:text-slate-900'}`}>
                          Hipertrofia
                        </p>
                        <p className="text-sm text-slate-400 dark:text-slate-600">6-12 reps • Volumen moderado • 1-2 min descanso</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrainingGoal('endurance')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      trainingGoal === 'endurance'
                        ? 'border-green-500 bg-green-500/20 dark:bg-green-100'
                        : 'border-slate-600 dark:border-slate-300 bg-slate-700/30 dark:bg-slate-50 hover:border-green-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚡</span>
                      <div>
                        <p className={`font-bold ${trainingGoal === 'endurance' ? 'text-green-400 dark:text-green-600' : 'text-white dark:text-slate-900'}`}>
                          Resistencia
                        </p>
                        <p className="text-sm text-slate-400 dark:text-slate-600">15+ reps • Cargas ligeras • 30-60 seg descanso</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-700/30 dark:bg-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                    <p className="text-slate-400 dark:text-slate-600 text-sm">Peso (kg)</p>
                  </div>
                  <p className="text-white dark:text-slate-900 font-bold text-3xl">
                    {user?.weight !== undefined && user?.weight !== null ? user.weight : 0}
                  </p>
                </div>
                <div className="bg-slate-700/30 dark:bg-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                    <p className="text-slate-400 dark:text-slate-600 text-sm">Estatura (cm)</p>
                  </div>
                  <p className="text-white dark:text-slate-900 font-bold text-3xl">
                    {user?.height !== undefined && user?.height !== null ? user.height : 0}
                  </p>
                </div>
              </div>

              {/* BMI Display */}
              {bmi !== null && (
                <div className="bg-slate-700/30 dark:bg-slate-200 rounded-xl p-4 mb-4">
                  <p className="text-slate-400 dark:text-slate-600 text-sm mb-2">Índice de Masa Corporal (IMC)</p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-white dark:text-slate-900 font-bold text-4xl">{bmi.toFixed(1)}</p>
                    <span className="text-emerald-400 dark:text-emerald-600 text-sm font-medium px-3 py-1 bg-emerald-500/20 dark:bg-emerald-100 rounded-full">
                      {bmiCategory}
                    </span>
                  </div>
                </div>
              )}

              {/* Training Goal Display */}
              <div className="bg-slate-700/30 dark:bg-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                  <p className="text-slate-400 dark:text-slate-600 text-sm">Objetivo de Entrenamiento</p>
                </div>
                {user?.trainingGoal === 'strength' && (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💪</span>
                    <div>
                      <p className="text-blue-400 dark:text-blue-600 font-bold text-lg">Fuerza</p>
                      <p className="text-slate-400 dark:text-slate-600 text-xs">1-6 reps • Cargas pesadas • 3-5 min descanso</p>
                    </div>
                  </div>
                )}
                {(user?.trainingGoal === 'hypertrophy' || !user?.trainingGoal) && (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🏋️</span>
                    <div>
                      <p className="text-purple-400 dark:text-purple-600 font-bold text-lg">Hipertrofia</p>
                      <p className="text-slate-400 dark:text-slate-600 text-xs">6-12 reps • Volumen moderado • 1-2 min descanso</p>
                    </div>
                  </div>
                )}
                {user?.trainingGoal === 'endurance' && (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">⚡</span>
                    <div>
                      <p className="text-green-400 dark:text-green-600 font-bold text-lg">Resistencia</p>
                      <p className="text-slate-400 dark:text-slate-600 text-xs">15+ reps • Cargas ligeras • 30-60 seg descanso</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Workout Statistics */}
        {!isEditing && (
          <div className="bg-slate-800/60 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-slate-700/50 dark:bg-slate-200 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-slate-300 dark:text-slate-700" />
              </div>
              <h2 className="text-lg font-bold text-white dark:text-slate-900">Estadísticas de Entrenamiento</h2>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-700/30 dark:bg-slate-200 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400 dark:text-emerald-600">{thisWeekWorkouts}</p>
                <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">Esta semana</p>
              </div>
              <div className="bg-slate-700/30 dark:bg-slate-200 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-400 dark:text-blue-600">{totalWorkouts}</p>
                <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">Total sesiones</p>
              </div>
              <div className="bg-slate-700/30 dark:bg-slate-200 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-purple-400 dark:text-purple-600">
                  {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
                </p>
                <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">kg levantados</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Workouts */}
        {!isEditing && workouts.length > 0 && (
          <div className="bg-slate-800/60 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-2xl p-6 mb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-slate-700/50 dark:bg-slate-200 p-2 rounded-lg">
                  <History className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                </div>
                <h2 className="text-lg font-bold text-white dark:text-slate-900">Últimos Entrenamientos</h2>
              </div>
              <button
                onClick={() => router.push('/history')}
                className="text-blue-400 dark:text-blue-600 hover:text-blue-300 dark:hover:text-blue-700 text-sm font-medium transition-colors"
              >
                Ver todos →
              </button>
            </div>

            <div className="space-y-3">
              {workouts.map((workout) => (
                <div
                  key={workout.id}
                  onClick={() => router.push('/history')}
                  className="bg-slate-700/30 dark:bg-slate-200 rounded-xl p-4 cursor-pointer hover:bg-slate-700/50 dark:hover:bg-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white dark:text-slate-900 font-bold text-lg mb-1 truncate">
                        {workout.routineName}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(workout.date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {workout.duration} min
                        </span>
                        {workout.rpe && (
                          <span className="flex items-center gap-1">
                            RPE: {workout.rpe}/10
                          </span>
                        )}
                      </div>
                    </div>
                    {workout.totalVolume && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-purple-400 dark:text-purple-600 font-bold text-lg">
                          {workout.totalVolume}kg
                        </p>
                        <p className="text-slate-400 dark:text-slate-600 text-xs">Volumen</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 text-xs">
                    <Dumbbell className="w-3 h-3" />
                    <span>{workout.exercises.length} ejercicios</span>
                    <span>•</span>
                    <span>
                      {workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)} series completadas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isEditing ? (
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Guardar Cambios
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-slate-700 dark:bg-slate-300 hover:bg-slate-600 dark:hover:bg-slate-400 text-white dark:text-slate-900 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => router.push('/diagnostics')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <Database className="w-4 h-4" />
              Diagnóstico de Datos
            </button>
            {unsyncedCount > 0 && (
              <button
                onClick={() => setShowMigrationModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <Database className="w-4 h-4" />
                Migrar {unsyncedCount} Entrenamientos a Supabase
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </>
        )}
        </div>
      </PageTransition>

      {/* Migration Modal */}
      {showMigrationModal && (
        <MigrationModal
          onClose={() => setShowMigrationModal(false)}
          onSuccess={() => {
            loadWorkoutHistory();
            setShowMigrationModal(false);
          }}
        />
      )}
    </div>
  );
}
