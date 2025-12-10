'use client';

import { useState } from 'react';
import { TrainingGoal } from '@/types';
import { Target, Zap, TrendingUp, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingModalProps {
  userName: string;
  onComplete: (goal: TrainingGoal) => void;
}

export default function OnboardingModal({ userName, onComplete }: OnboardingModalProps) {
  const [selectedGoal, setSelectedGoal] = useState<TrainingGoal | null>(null);

  const goals = [
    {
      id: 'strength' as TrainingGoal,
      title: 'Fuerza',
      description: 'Aumentar la fuerza máxima y levantar más peso',
      purpose: 'Para: Levantar más peso, desarrollar fuerza funcional',
      icon: Dumbbell,
      color: 'from-red-500 to-orange-500',
      borderColor: 'border-red-500',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      features: [
        'Series de 3-5 repeticiones',
        'Descansos largos (3-5 min)'
      ]
    },
    {
      id: 'hypertrophy' as TrainingGoal,
      title: 'Hipertrofia',
      description: 'Ganar masa muscular y volumen',
      purpose: 'Para: Aumentar tamaño muscular, ganar volumen',
      icon: TrendingUp,
      color: 'from-blue-500 to-purple-500',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      features: [
        'Series de 8-12 repeticiones',
        'Descansos moderados (60-90s)'
      ]
    },
    {
      id: 'endurance' as TrainingGoal,
      title: 'Resistencia',
      description: 'Mejorar la resistencia muscular y cardiovascular',
      purpose: 'Para: Mayor aguante, mejor condición física',
      icon: Zap,
      color: 'from-green-500 to-emerald-500',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      features: [
        'Series de 15+ repeticiones',
        'Descansos cortos (30-45s)'
      ]
    }
  ];

  const handleSelectGoal = (goal: TrainingGoal) => {
    setSelectedGoal(goal);
  };

  const handleConfirm = () => {
    if (selectedGoal) {
      onComplete(selectedGoal);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-700/50 dark:border-slate-200 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 md:p-8 text-center border-b border-slate-700/50 dark:border-slate-200 flex-shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
            <Target className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white dark:text-slate-900 mb-2">
            ¡Bienvenido, {userName}! 👋
          </h1>
          <p className="text-slate-400 dark:text-slate-600 text-sm sm:text-base md:text-lg">
            Para empezar, cuéntanos cuál es tu objetivo principal de entrenamiento
          </p>
        </div>

        {/* Goals */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1">
          {/* Mobile: horizontal scroll, Desktop: grid */}
          <div className="md:grid md:grid-cols-3 md:gap-6 flex md:flex-none overflow-x-auto md:overflow-x-visible gap-4 pb-4 md:pb-0 snap-x snap-mandatory md:snap-none mb-6 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
            {goals.map((goal) => {
              const Icon = goal.icon;
              const isSelected = selectedGoal === goal.id;

              return (
                <button
                  key={goal.id}
                  onClick={() => handleSelectGoal(goal.id)}
                  className={`relative p-4 sm:p-5 md:p-6 rounded-xl border-2 transition-all text-left flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-auto snap-center ${
                    isSelected
                      ? `${goal.borderColor} bg-slate-800/50 dark:bg-slate-100 shadow-lg`
                      : 'border-slate-700/50 dark:border-slate-300 bg-slate-800/30 dark:bg-slate-50 hover:border-slate-600 dark:hover:border-slate-400'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${goal.bgColor} dark:bg-opacity-50 flex items-center justify-center mb-3 sm:mb-4`}>
                    <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${goal.textColor} dark:opacity-80`} />
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white dark:text-slate-900 mb-1 sm:mb-2">
                    {goal.title}
                  </h3>

                  <p className="text-xs sm:text-sm font-medium text-emerald-400 dark:text-emerald-600 mb-2 sm:mb-3">
                    {goal.purpose}
                  </p>

                  <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-600 mb-3 sm:mb-4">
                    {goal.description}
                  </p>

                  <div className="space-y-1.5 sm:space-y-2">
                    {goal.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <p className="text-xs text-slate-500 dark:text-slate-700">{feature}</p>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scroll indicator for mobile */}
          <div className="flex md:hidden justify-center gap-1.5 mb-6">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className={`h-1.5 rounded-full transition-all ${
                  selectedGoal === goal.id
                    ? 'w-6 bg-emerald-500'
                    : 'w-1.5 bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Info */}
          <div className="bg-blue-500/10 dark:bg-blue-100 border border-blue-500/30 dark:border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex-shrink-0">
            <p className="text-xs sm:text-sm text-blue-300 dark:text-blue-800">
              <span className="font-semibold">💡 Consejo:</span> No te preocupes, podrás cambiar tu objetivo en cualquier momento desde tu perfil.
            </p>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleConfirm}
            disabled={!selectedGoal}
            className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all flex-shrink-0 ${
              selectedGoal
                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg hover:shadow-emerald-500/50'
                : 'bg-slate-700 dark:bg-slate-300 text-slate-500 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            {selectedGoal ? 'Continuar' : 'Selecciona un objetivo'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
