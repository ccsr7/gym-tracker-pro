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
      icon: Dumbbell,
      color: 'from-red-500 to-orange-500',
      borderColor: 'border-red-500',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      features: [
        'Series de 3-5 repeticiones',
        'Descansos largos (3-5 min)',
        'Énfasis en peso máximo',
        'Progresión lineal'
      ]
    },
    {
      id: 'hypertrophy' as TrainingGoal,
      title: 'Hipertrofia',
      description: 'Ganar masa muscular y volumen',
      icon: TrendingUp,
      color: 'from-blue-500 to-purple-500',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      features: [
        'Series de 8-12 repeticiones',
        'Descansos moderados (60-90s)',
        'Mayor volumen de trabajo',
        'Variedad de ejercicios'
      ]
    },
    {
      id: 'endurance' as TrainingGoal,
      title: 'Resistencia',
      description: 'Mejorar la resistencia muscular y cardiovascular',
      icon: Zap,
      color: 'from-green-500 to-emerald-500',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      features: [
        'Series de 15+ repeticiones',
        'Descansos cortos (30-45s)',
        'Mayor densidad de trabajo',
        'Circuitos y supersets'
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-700/50 dark:border-slate-200"
      >
        {/* Header */}
        <div className="p-8 text-center border-b border-slate-700/50 dark:border-slate-200">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center"
          >
            <Target className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white dark:text-slate-900 mb-2"
          >
            ¡Bienvenido, {userName}! 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 dark:text-slate-600 text-lg"
          >
            Para empezar, cuéntanos cuál es tu objetivo principal de entrenamiento
          </motion.p>
        </div>

        {/* Goals */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {goals.map((goal, index) => {
              const Icon = goal.icon;
              const isSelected = selectedGoal === goal.id;

              return (
                <motion.button
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={() => handleSelectGoal(goal.id)}
                  className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? `${goal.borderColor} bg-slate-800/50 dark:bg-slate-100 shadow-lg scale-105`
                      : 'border-slate-700/50 dark:border-slate-300 bg-slate-800/30 dark:bg-slate-50 hover:border-slate-600 dark:hover:border-slate-400 hover:scale-102'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="selected-indicator"
                      className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}

                  <div className={`w-14 h-14 rounded-lg ${goal.bgColor} dark:bg-opacity-50 flex items-center justify-center mb-4`}>
                    <Icon className={`w-8 h-8 ${goal.textColor} dark:opacity-80`} />
                  </div>

                  <h3 className="text-xl font-bold text-white dark:text-slate-900 mb-2">
                    {goal.title}
                  </h3>
                  <p className="text-sm text-slate-400 dark:text-slate-600 mb-4">
                    {goal.description}
                  </p>

                  <div className="space-y-2">
                    {goal.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <p className="text-xs text-slate-500 dark:text-slate-700">{feature}</p>
                      </div>
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-blue-500/10 dark:bg-blue-100 border border-blue-500/30 dark:border-blue-200 rounded-lg p-4 mb-6"
          >
            <p className="text-sm text-blue-300 dark:text-blue-800">
              <span className="font-semibold">💡 Consejo:</span> No te preocupes, podrás cambiar tu objetivo en cualquier momento desde tu perfil.
            </p>
          </motion.div>

          {/* Continue Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            onClick={handleConfirm}
            disabled={!selectedGoal}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              selectedGoal
                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg hover:shadow-emerald-500/50'
                : 'bg-slate-700 dark:bg-slate-300 text-slate-500 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            {selectedGoal ? 'Continuar' : 'Selecciona un objetivo'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
