'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { getWorkouts } from '@/lib/supabase/services/workouts';
import { Database, Download, Upload, CheckCircle, XCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import LoadingLogo from '@/components/ui/LoadingLogo';
import { Workout } from '@/types';
import { useRouter } from 'next/navigation';

interface DiagnosticData {
  localStorage: {
    workouts: number;
    routines: number;
    restDays: number;
    firstWorkout?: string;
    lastWorkout?: string;
  };
  supabase: {
    workouts: number;
    routines: number;
    restDays: number;
    firstWorkout?: string;
    lastWorkout?: string;
  };
  sync: {
    workoutsInLocalOnly: number;
    workoutsInSupabaseOnly: number;
    workoutsInBoth: number;
  };
}

export default function DiagnosticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    loadDiagnostics();
  }, [user]);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      // Get localStorage data
      const localWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
      const localRoutines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
      const localRestDays = JSON.parse(localStorage.getItem('gym-tracker-rest-days') || '[]');

      const diagnostics: DiagnosticData = {
        localStorage: {
          workouts: localWorkouts.length,
          routines: localRoutines.length,
          restDays: localRestDays.length,
          firstWorkout: localWorkouts.length > 0 ? localWorkouts[0].date : undefined,
          lastWorkout: localWorkouts.length > 0 ? localWorkouts[localWorkouts.length - 1].date : undefined,
        },
        supabase: {
          workouts: 0,
          routines: 0,
          restDays: 0,
        },
        sync: {
          workoutsInLocalOnly: 0,
          workoutsInSupabaseOnly: 0,
          workoutsInBoth: 0,
        },
      };

      // Get Supabase data if user is authenticated
      if (user) {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (supabaseUser) {
          // Get workouts count
          const { data: workoutsData } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', supabaseUser.id)
            .order('date', { ascending: true });

          // Get routines count
          const { data: routinesData } = await supabase
            .from('routines')
            .select('id')
            .eq('user_id', supabaseUser.id);

          // Get rest days count
          const { data: restDaysData } = await supabase
            .from('rest_days')
            .select('id')
            .eq('user_id', supabaseUser.id);

          diagnostics.supabase.workouts = workoutsData?.length || 0;
          diagnostics.supabase.routines = routinesData?.length || 0;
          diagnostics.supabase.restDays = restDaysData?.length || 0;

          if (workoutsData && workoutsData.length > 0) {
            diagnostics.supabase.firstWorkout = workoutsData[0].date;
            diagnostics.supabase.lastWorkout = workoutsData[workoutsData.length - 1].date;
          }

          // Calculate sync status
          const supabaseWorkouts = workoutsData || [];
          const supabaseIds = new Set(supabaseWorkouts.map((w: any) => w.id));
          const localIds = new Set(localWorkouts.map((w: Workout) => w.id));

          diagnostics.sync.workoutsInBoth = localWorkouts.filter((w: Workout) => supabaseIds.has(w.id)).length;
          diagnostics.sync.workoutsInLocalOnly = localWorkouts.filter((w: Workout) => !supabaseIds.has(w.id)).length;
          diagnostics.sync.workoutsInSupabaseOnly = supabaseWorkouts.filter((w: any) => !localIds.has(w.id)).length;
        }
      }

      setDiagnosticData(diagnostics);
    } catch (error) {
      console.error('[Diagnostics] Error loading diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportBackup = () => {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        workouts: JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]'),
        routines: JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]'),
        restDays: JSON.parse(localStorage.getItem('gym-tracker-rest-days') || '[]'),
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gym-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSyncResult('✅ Backup exportado exitosamente');
      setTimeout(() => setSyncResult(null), 3000);
    } catch (error) {
      console.error('[Diagnostics] Error exporting backup:', error);
      setSyncResult('❌ Error al exportar backup');
    }
  };

  const forceSync = async () => {
    if (!user) {
      setSyncResult('❌ Debes estar autenticado para sincronizar');
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (!supabaseUser) {
        setSyncResult('❌ No se pudo obtener el usuario');
        return;
      }

      // Force reload from Supabase
      await getWorkouts(supabaseUser.id);

      // Reload diagnostics
      await loadDiagnostics();

      setSyncResult('✅ Sincronización completada. Recarga la página para ver los cambios.');
    } catch (error) {
      console.error('[Diagnostics] Error forcing sync:', error);
      setSyncResult(`❌ Error al sincronizar: ${error}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <LoadingLogo size="xl" variant="lift" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="w-8 h-8 text-emerald-500" />
            Diagnóstico de Datos
          </h1>
          <p className="text-slate-400">
            Verifica dónde están tus datos y sincronízalos entre dispositivos
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={exportBackup}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exportar Backup
          </button>

          <button
            onClick={forceSync}
            disabled={syncing || !user}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-slate-700 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <LoadingLogo size="sm" variant="lift" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Forzar Sync desde Supabase
              </>
            )}
          </button>

          <button
            onClick={loadDiagnostics}
            className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Recargar Datos
          </button>
        </div>

        {/* Sync Result */}
        {syncResult && (
          <div className={`mb-6 p-4 rounded-lg ${syncResult.startsWith('✅') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {syncResult}
          </div>
        )}

        {/* Diagnostic Cards */}
        {diagnosticData && (
          <div className="space-y-6">
            {/* localStorage Card */}
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-blue-400" />
                Datos en Este Dispositivo (localStorage)
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">{diagnosticData.localStorage.workouts}</p>
                  <p className="text-slate-400 text-sm mt-1">Entrenamientos</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">{diagnosticData.localStorage.routines}</p>
                  <p className="text-slate-400 text-sm mt-1">Rutinas</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-orange-400">{diagnosticData.localStorage.restDays}</p>
                  <p className="text-slate-400 text-sm mt-1">Días de Descanso</p>
                </div>
              </div>
              {diagnosticData.localStorage.firstWorkout && (
                <div className="mt-4 text-sm text-slate-400">
                  <p>Primer entrenamiento: {new Date(diagnosticData.localStorage.firstWorkout).toLocaleDateString('es-ES')}</p>
                  <p>Último entrenamiento: {new Date(diagnosticData.localStorage.lastWorkout!).toLocaleDateString('es-ES')}</p>
                </div>
              )}
            </div>

            {/* Supabase Card */}
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-emerald-400" />
                Datos en la Nube (Supabase)
              </h2>
              {user ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-emerald-400">{diagnosticData.supabase.workouts}</p>
                      <p className="text-slate-400 text-sm mt-1">Entrenamientos</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-purple-400">{diagnosticData.supabase.routines}</p>
                      <p className="text-slate-400 text-sm mt-1">Rutinas</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-orange-400">{diagnosticData.supabase.restDays}</p>
                      <p className="text-slate-400 text-sm mt-1">Días de Descanso</p>
                    </div>
                  </div>
                  {diagnosticData.supabase.firstWorkout && (
                    <div className="mt-4 text-sm text-slate-400">
                      <p>Primer entrenamiento: {new Date(diagnosticData.supabase.firstWorkout).toLocaleDateString('es-ES')}</p>
                      <p>Último entrenamiento: {new Date(diagnosticData.supabase.lastWorkout!).toLocaleDateString('es-ES')}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-400">Debes iniciar sesión para ver los datos de Supabase</p>
              )}
            </div>

            {/* Sync Status Card */}
            {user && (
              <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-yellow-400" />
                  Estado de Sincronización
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-white">Entrenamientos sincronizados</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-400">{diagnosticData.sync.workoutsInBoth}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      <span className="text-white">Solo en este dispositivo (sin sincronizar)</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-400">{diagnosticData.sync.workoutsInLocalOnly}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-blue-400" />
                      <span className="text-white">Solo en la nube (no en este dispositivo)</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-400">{diagnosticData.sync.workoutsInSupabaseOnly}</span>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Recomendaciones:</h3>
                  <ul className="text-slate-300 text-sm space-y-1">
                    {diagnosticData.sync.workoutsInLocalOnly > 0 && (
                      <li>• Tienes {diagnosticData.sync.workoutsInLocalOnly} entrenamientos sin sincronizar. Ve a Perfil y usa "Migrar Datos a Supabase".</li>
                    )}
                    {diagnosticData.sync.workoutsInSupabaseOnly > 0 && (
                      <li>• Hay {diagnosticData.sync.workoutsInSupabaseOnly} entrenamientos en la nube que no están en este dispositivo. Usa "Forzar Sync desde Supabase" arriba.</li>
                    )}
                    {diagnosticData.sync.workoutsInLocalOnly === 0 && diagnosticData.sync.workoutsInSupabaseOnly === 0 && diagnosticData.sync.workoutsInBoth > 0 && (
                      <li className="text-emerald-400">✅ Todos tus datos están sincronizados correctamente.</li>
                    )}
                    {diagnosticData.localStorage.workouts === 0 && diagnosticData.supabase.workouts === 0 && (
                      <li className="text-slate-400">No tienes entrenamientos guardados aún.</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 flex gap-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            ← Volver al Inicio
          </a>
          <a
            href="/profile"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            Ir a Perfil →
          </a>
        </div>
      </div>
    </div>
  );
}
