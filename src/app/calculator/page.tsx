'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import PageTransition from '@/components/PageTransition';
import { calculate1RM } from '@/lib/utils';
import { Calculator, Info, TrendingUp, Target, Zap, Dumbbell, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { TrainingGoal } from '@/types';

type TrainingZone = {
  name: string;
  percent: number;
  weight: number;
  reps: string;
  description: string;
  color: string;
  icon: any;
};

export default function CalculatorPage() {
  const { user } = useAuth();
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [userGoal, setUserGoal] = useState<TrainingGoal>('hypertrophy');

  useEffect(() => {
    if (user?.trainingGoal) {
      setUserGoal(user.trainingGoal);
    }
  }, [user]);

  const handleCalculate = () => {
    const w = parseFloat(weight);
    const r = parseInt(reps);

    if (w > 0 && r > 0 && r <= 12) {
      const oneRM = calculate1RM(w, r);
      setResult(oneRM);
    } else if (r > 12) {
      alert('Para mejor precisión, usa un peso con el que puedas hacer máximo 12 repeticiones');
    } else {
      alert('Por favor ingresa valores válidos');
    }
  };

  const getRecommendedZoneName = (): string => {
    switch (userGoal) {
      case 'strength':
        return 'Fuerza';
      case 'hypertrophy':
        return 'Hipertrofia';
      case 'endurance':
        return 'Resistencia Muscular';
      default:
        return 'Hipertrofia';
    }
  };

  const getTrainingZones = (): TrainingZone[] => {
    if (!result) return [];

    return [
      {
        name: 'Fuerza Máxima',
        percent: 95,
        weight: Math.round(result * 0.95),
        reps: '1-2',
        description: 'Desarrollo de fuerza pura y potencia máxima',
        color: 'from-red-500/20 to-red-600/10 border-red-500/30',
        icon: Zap
      },
      {
        name: 'Fuerza',
        percent: 90,
        weight: Math.round(result * 0.90),
        reps: '2-3',
        description: 'Incremento de fuerza con bajo volumen',
        color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
        icon: Dumbbell
      },
      {
        name: 'Fuerza-Hipertrofia',
        percent: 85,
        weight: Math.round(result * 0.85),
        reps: '3-5',
        description: 'Zona óptima para fuerza e hipertrofia',
        color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
        icon: TrendingUp
      },
      {
        name: 'Hipertrofia',
        percent: 75,
        weight: Math.round(result * 0.75),
        reps: '6-10',
        description: 'Rango ideal para crecimiento muscular',
        color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
        icon: Target
      },
      {
        name: 'Resistencia Muscular',
        percent: 65,
        weight: Math.round(result * 0.65),
        reps: '11-15',
        description: 'Desarrollo de resistencia y acondicionamiento',
        color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
        icon: TrendingUp
      },
    ];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCalculate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <PageTransition>
        <div className="container mx-auto px-4 pt-20 py-8 pb-24 md:pt-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white dark:text-slate-900 mb-2 flex items-center gap-3">
            <Calculator className="w-8 h-8 text-emerald-500" />
            Calculadora de 1RM
          </h1>
          <p className="text-slate-400 dark:text-slate-600">Calcula tu repetición máxima y obtén zonas de entrenamiento personalizadas</p>
        </div>

        {/* What is 1RM */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-100 dark:to-emerald-50 border border-emerald-500/20 dark:border-emerald-200 rounded-xl p-6 mb-6">
          <div className="flex gap-4">
            <div className="bg-emerald-500/20 dark:bg-emerald-200 p-3 rounded-lg h-fit">
              <Info className="w-6 h-6 text-emerald-400 dark:text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white dark:text-slate-900 mb-2">¿Qué es 1RM?</h3>
              <p className="text-slate-300 dark:text-slate-700 mb-3">
                1RM (One Repetition Maximum) es el peso máximo que puedes levantar en un ejercicio con una sola repetición.
                Es un indicador clave de tu fuerza máxima.
              </p>
              <p className="text-emerald-300 dark:text-emerald-700 text-sm">
                💡 No necesitas intentar tu 1RM real - esta calculadora lo estima de forma segura basándose en un peso que puedas levantar varias veces.
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white dark:text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            Cómo usar esta calculadora
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-700/30 dark:bg-slate-200 rounded-lg p-4">
              <div className="bg-emerald-500/20 dark:bg-emerald-200 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                <span className="text-emerald-400 dark:text-emerald-700 font-bold">1</span>
              </div>
              <h4 className="text-white dark:text-slate-900 font-medium mb-2">Elige un ejercicio</h4>
              <p className="text-slate-400 dark:text-slate-600 text-sm">
                Elige el ejercicio que quieres medir (press banca, sentadilla, peso muerto, etc.)
              </p>
            </div>
            <div className="bg-slate-700/30 dark:bg-slate-200 rounded-lg p-4">
              <div className="bg-emerald-500/20 dark:bg-emerald-200 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                <span className="text-emerald-400 dark:text-emerald-700 font-bold">2</span>
              </div>
              <h4 className="text-white dark:text-slate-900 font-medium mb-2">Registra tu serie</h4>
              <p className="text-slate-400 dark:text-slate-600 text-sm">
                Anota el peso que levantaste y cuántas repeticiones completaste (ideal: 3-8 reps, máximo 12)
              </p>
            </div>
            <div className="bg-slate-700/30 dark:bg-slate-200 rounded-lg p-4">
              <div className="bg-emerald-500/20 dark:bg-emerald-200 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                <span className="text-emerald-400 dark:text-emerald-700 font-bold">3</span>
              </div>
              <h4 className="text-white dark:text-slate-900 font-medium mb-2">Obtén resultados</h4>
              <p className="text-slate-400 dark:text-slate-600 text-sm">
                Recibe tu 1RM estimado y zonas de entrenamiento para diferentes objetivos
              </p>
            </div>
          </div>
        </div>

        {/* Calculator Form */}
        <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white dark:text-slate-900 mb-4">Ingresa tus datos</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-700 mb-2">
                Peso Levantado (kg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="100"
                step="0.5"
                className="w-full px-4 py-4 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 text-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              <p className="text-slate-500 dark:text-slate-600 text-xs mt-1">El peso que levantaste en tu última serie</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-700 mb-2">
                Repeticiones Completadas
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="5"
                min="1"
                max="12"
                step="1"
                className="w-full px-4 py-4 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 text-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Warning for high reps */}
          {parseInt(reps) > 8 && parseInt(reps) <= 12 && (
            <div className="bg-yellow-500/10 dark:bg-yellow-100 border border-yellow-500/30 dark:border-yellow-300 rounded-lg p-4 mb-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 dark:text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-300 dark:text-yellow-700 mb-1">
                  Precaución: Mayor margen de error
                </p>
                <p className="text-sm text-yellow-300 dark:text-yellow-700">
                  Con más de 8 repeticiones, la estimación de 1RM puede ser menos precisa. Para mejores resultados,
                  usa un peso con el que puedas hacer entre 3 y 8 repeticiones como máximo.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleCalculate}
            disabled={!weight || !reps}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-3 text-lg shadow-lg shadow-emerald-500/20"
          >
            <Calculator className="w-6 h-6" />
            Calcular 1RM
          </button>
        </div>

        {/* Result */}
        {result && (
          <>
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 dark:from-emerald-100 dark:to-emerald-50 backdrop-blur-sm border-2 border-emerald-500/40 dark:border-emerald-300 rounded-2xl p-8 mb-6 text-center shadow-2xl shadow-emerald-500/10">
              <p className="text-emerald-300 dark:text-emerald-700 text-sm font-medium mb-2 uppercase tracking-wide">Tu 1RM Estimado</p>
              <p className="text-7xl md:text-8xl font-bold text-white dark:text-emerald-600 mb-2">{result}</p>
              <p className="text-2xl text-emerald-300 dark:text-emerald-700 font-semibold">kilogramos</p>
              <div className="mt-6 pt-6 border-t border-emerald-500/20 dark:border-emerald-300">
                <p className="text-slate-300 dark:text-slate-700 text-sm">
                  Calculado usando la fórmula de Brzycki con {weight}kg x {reps} reps
                </p>
              </div>
            </div>

            {/* Training Zones */}
            <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-slate-700/80 to-slate-700/50 dark:from-slate-200 dark:to-slate-100 px-6 py-5 border-b border-slate-600/50 dark:border-slate-300">
                <h3 className="text-xl font-bold text-white dark:text-slate-900 mb-1">Zonas de Entrenamiento</h3>
                <p className="text-slate-400 dark:text-slate-600 text-sm">Pesos recomendados según tu objetivo de entrenamiento</p>
              </div>

              <div className="p-6">
                <div className="grid gap-4">
                  {getTrainingZones().map((zone) => {
                    const Icon = zone.icon;
                    const isRecommended = zone.name === getRecommendedZoneName();
                    return (
                      <div
                        key={zone.percent}
                        className={`bg-gradient-to-br ${zone.color} backdrop-blur-sm rounded-xl p-5 hover:scale-[1.02] transition-all border ${
                          isRecommended ? 'ring-2 ring-yellow-400 dark:ring-yellow-500 shadow-lg shadow-yellow-500/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-white/10 dark:bg-slate-900/10 p-2.5 rounded-lg">
                              <Icon className="w-5 h-5 text-white dark:text-slate-900" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-white dark:text-slate-900 font-bold text-lg">{zone.name}</h4>
                                {isRecommended && (
                                  <span className="bg-yellow-400 dark:bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                                    ⭐ Recomendado
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-300 dark:text-slate-700 text-sm">{zone.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="bg-white/10 dark:bg-slate-900/10 px-3 py-1 rounded-full">
                              <span className="text-white dark:text-slate-900 font-bold text-sm">{zone.percent}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-baseline justify-between bg-black/20 dark:bg-slate-900/10 rounded-lg px-4 py-3">
                          <div>
                            <p className="text-slate-400 dark:text-slate-600 text-xs mb-1">PESO RECOMENDADO</p>
                            <p className="text-white dark:text-slate-900 font-bold text-3xl">{zone.weight} kg</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-400 dark:text-slate-600 text-xs mb-1">REPETICIONES</p>
                            <p className="text-white dark:text-slate-900 font-bold text-xl">{zone.reps}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white dark:text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Consejos de Entrenamiento
              </h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="text-emerald-500 mt-1">•</div>
                  <p className="text-slate-300 dark:text-slate-700 text-sm">
                    <span className="font-semibold text-white dark:text-slate-900">Periodización:</span> Varía entre zonas cada 4-6 semanas para evitar estancamiento
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="text-emerald-500 mt-1">•</div>
                  <p className="text-slate-300 dark:text-slate-700 text-sm">
                    <span className="font-semibold text-white dark:text-slate-900">Descanso:</span> Zonas de alta intensidad (85-95%) requieren 3-5 min de descanso entre series
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="text-emerald-500 mt-1">•</div>
                  <p className="text-slate-300 dark:text-slate-700 text-sm">
                    <span className="font-semibold text-white dark:text-slate-900">Progresión:</span> Recalcula tu 1RM cada 4-6 semanas para ajustar tus pesos
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="text-emerald-500 mt-1">•</div>
                  <p className="text-slate-300 dark:text-slate-700 text-sm">
                    <span className="font-semibold text-white dark:text-slate-900">Seguridad:</span> Nunca intentes tu 1RM real sin un spotter experimentado
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Bottom info when no results */}
        {!result && (
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 text-center">
            <Dumbbell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white dark:text-slate-900 font-semibold mb-2">Ingresa tus datos para comenzar</h3>
            <p className="text-slate-400 dark:text-slate-600 text-sm">
              Calcula tu 1RM y descubre las zonas de entrenamiento óptimas para alcanzar tus objetivos
            </p>
          </div>
        )}
        </div>
      </PageTransition>
    </div>
  );
}
