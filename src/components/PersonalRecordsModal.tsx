'use client';

import { useState, useMemo } from 'react';
import { X, Search, TrendingDown, TrendingUp, ArrowUpDown } from 'lucide-react';
import { Workout } from '@/types';
import { getPersonalRecords } from '@/lib/volume-stats';
import { getExerciseById } from '@/data/exercises';

interface PersonalRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workouts: Workout[];
}

type SortField = 'weight' | 'date' | 'name';
type SortDirection = 'asc' | 'desc';

export default function PersonalRecordsModal({ isOpen, onClose, workouts }: PersonalRecordsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('weight');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get all personal records
  const allPRs = useMemo(() => {
    const records = getPersonalRecords(workouts);
    return Array.from(records.values()).map(pr => {
      const exercise = getExerciseById(pr.exerciseId);
      return {
        exerciseId: pr.exerciseId,
        exerciseName: exercise?.name || 'Unknown',
        maxWeight: pr.maxWeight,
        maxReps: pr.maxReps,
        maxVolume: pr.maxVolume,
        date: new Date(pr.date),
      };
    });
  }, [workouts]);

  // Filter and sort PRs
  const filteredPRs = useMemo(() => {
    let filtered = allPRs;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pr =>
        pr.exerciseName.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'weight':
          comparison = a.maxWeight - b.maxWeight;
          break;
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'name':
          comparison = a.exerciseName.localeCompare(b.exerciseName);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allPRs, searchQuery, sortField, sortDirection]);

  // Calculate stats
  const stats = useMemo(() => {
    if (allPRs.length === 0) return { total: 0, avgWeight: 0, maxPR: 0 };

    const totalWeight = allPRs.reduce((sum, pr) => sum + pr.maxWeight, 0);
    const maxPR = Math.max(...allPRs.map(pr => pr.maxWeight));

    return {
      total: allPRs.length,
      avgWeight: Math.round(totalWeight / allPRs.length),
      maxPR,
    };
  }, [allPRs]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSortField('weight');
    setSortDirection('desc');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="relative w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl sm:rounded-2xl shadow-2xl border border-slate-700 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 p-3 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white truncate">Todos tus Récords</h2>
                <p className="text-xs sm:text-sm text-slate-400 truncate">
                  {stats.total} ejercicios · Prom: {stats.avgWeight} kg · Max: {stats.maxPR} kg
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors flex-shrink-0"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            </button>
          </div>

          {/* Search and Sort Controls */}
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Buscar ejercicio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Sort Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => handleSort('weight')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  sortField === 'weight'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Peso
                {sortField === 'weight' && (
                  sortDirection === 'desc' ? <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </button>
              <button
                onClick={() => handleSort('date')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  sortField === 'date'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Fecha
                {sortField === 'date' && (
                  sortDirection === 'desc' ? <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </button>
              <button
                onClick={() => handleSort('name')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  sortField === 'name'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Nombre
                {sortField === 'name' && (
                  <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {filteredPRs.length > 0 ? (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full min-w-[600px]">
                <thead className="sticky top-0 bg-slate-800/95 backdrop-blur-sm">
                  <tr className="text-left border-b border-slate-700">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-slate-300">#</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-slate-300">Ejercicio</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-slate-300 text-right">Peso</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-slate-300 text-right">Reps</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-slate-300 text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPRs.map((pr, index) => (
                    <tr
                      key={pr.exerciseId}
                      className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-400">{index + 1}</td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium text-white max-w-[200px] truncate">{pr.exerciseName}</td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-right">
                        <span className="font-bold text-emerald-400">{pr.maxWeight} kg</span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-300 text-right">
                        {pr.maxReps}
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-400 text-right whitespace-nowrap">
                        {pr.date.toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-base sm:text-lg mb-2">
                {searchQuery ? 'No se encontraron ejercicios' : 'No hay récords personales'}
              </p>
              {searchQuery && (
                <p className="text-slate-500 text-sm">
                  Intenta con otro término de búsqueda
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 p-3 sm:p-4 rounded-b-xl sm:rounded-b-2xl">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <p className="text-slate-400 truncate">
              {filteredPRs.length} de {stats.total} récords
            </p>
            <button
              onClick={handleClose}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
