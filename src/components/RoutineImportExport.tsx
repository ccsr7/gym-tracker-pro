'use client';

import { useState, useEffect } from 'react';
import { Routine } from '@/types';
import { getExerciseById } from '@/data/exercises';
import { X, Download, Upload, FileText, Copy, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import { useConfirm } from '@/hooks/useConfirm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

interface RoutineImportExportProps {
  onClose: () => void;
  onImport: () => void;
}

export default function RoutineImportExport({ onClose, onImport }: RoutineImportExportProps) {
  const toast = useToast();
  const { confirm, confirmState } = useConfirm();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [selectedRoutines, setSelectedRoutines] = useState<string[]>([]);
  const [exportCode, setExportCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [routines, setRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    const storedRoutines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
    setRoutines(storedRoutines);
  }, []);

  const toggleRoutineSelection = (routineId: string) => {
    if (selectedRoutines.includes(routineId)) {
      setSelectedRoutines(selectedRoutines.filter(id => id !== routineId));
    } else {
      setSelectedRoutines([...selectedRoutines, routineId]);
    }
  };

  const generateExportCode = () => {
    const selectedRoutineData = routines.filter(r => selectedRoutines.includes(r.id));
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      routines: selectedRoutineData,
    };

    // Generate a simple hash code (8 characters)
    const jsonString = JSON.stringify(exportData);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Convert to alphanumeric code
    const hashCode = Math.abs(hash).toString(36).toUpperCase().substring(0, 8).padStart(8, '0');

    // Store full data with hash as key
    const exportKey = `gym-export-${hashCode}`;
    localStorage.setItem(exportKey, btoa(JSON.stringify(exportData)));

    setExportCode(hashCode);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const importRoutines = async () => {
    try {
      // Try to get data from localStorage using the short code
      const exportKey = `gym-export-${importCode.trim().toUpperCase()}`;
      const storedData = localStorage.getItem(exportKey);

      let decoded;
      if (storedData) {
        // Short code found in localStorage
        decoded = JSON.parse(atob(storedData));
      } else {
        // Try to decode as old long format (backwards compatibility)
        try {
          decoded = JSON.parse(atob(importCode));
        } catch {
          toast.error('Código inválido. Verifica que el código sea correcto.');
          return;
        }
      }

      if (!decoded.routines || !Array.isArray(decoded.routines)) {
        toast.error('Código inválido. Por favor verifica el código e intenta nuevamente.');
        return;
      }

      const existingRoutines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');

      // Check for conflicts and ask user
      const conflicts = decoded.routines.filter((newRoutine: Routine) =>
        existingRoutines.some((existing: Routine) => existing.day === newRoutine.day)
      );

      if (conflicts.length > 0) {
        const conflictDays = conflicts.map((r: Routine) => r.day).join(', ');
        const shouldReplace = await confirm({
          title: 'Conflicto de rutinas',
          message: `Ya existen rutinas para: ${conflictDays}. ¿Deseas reemplazarlas?`,
          confirmText: 'Reemplazar',
          cancelText: 'Cancelar',
          type: 'warning',
        });

        if (!shouldReplace) {
          return;
        }
        // Remove conflicting routines
        conflicts.forEach((newRoutine: Routine) => {
          const index = existingRoutines.findIndex((r: Routine) => r.day === newRoutine.day);
          if (index !== -1) {
            existingRoutines.splice(index, 1);
          }
        });
      }

      // Add new routines with new IDs
      const importedRoutines = decoded.routines.map((r: Routine) => ({
        ...r,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      }));

      const updatedRoutines = [...existingRoutines, ...importedRoutines];
      localStorage.setItem('gym-tracker-routines', JSON.stringify(updatedRoutines));

      toast.success(`${importedRoutines.length} rutina(s) importada(s) exitosamente`);
      onImport();
      onClose();
    } catch (error) {
      toast.error('Error al importar rutinas. Verifica que el código sea válido.');
      console.error(error);
    }
  };

  const exportToPDF = () => {
    const selectedRoutineData = routines.filter(r => selectedRoutines.includes(r.id));
    if (selectedRoutineData.length === 0) {
      toast.warning('Selecciona al menos una rutina para exportar');
      return;
    }

    const doc = new jsPDF();

    // Color palette matching the app
    const colors = {
      primary: [16, 25, 40], // Dark background
      orange: [249, 115, 22], // Orange accent
      white: [255, 255, 255],
      gray: [148, 163, 184],
      lightGray: [241, 245, 249],
      emerald: [16, 185, 129],
      blue: [59, 130, 246],
      purple: [168, 85, 247],
      cyan: [6, 182, 212],
      pink: [236, 72, 153],
    };

    const dayColors: Record<string, number[]> = {
      'Lunes': colors.blue,
      'Martes': colors.purple,
      'Miércoles': colors.pink,
      'Jueves': colors.orange,
      'Viernes': colors.emerald,
      'Sábado': colors.cyan,
      'Domingo': [239, 68, 68],
    };

    const drawHeader = (isFirstPage: boolean) => {
      // Dark header background
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(0, 0, 210, 50, 'F');

      // Orange accent bar at top
      doc.setFillColor(colors.orange[0], colors.orange[1], colors.orange[2]);
      doc.rect(0, 0, 210, 4, 'F');

      if (isFirstPage) {
        // Logo icon - Orange gradient box with dumbbell
        doc.setFillColor(colors.orange[0], colors.orange[1], colors.orange[2]);
        doc.roundedRect(20, 12, 10, 10, 1.5, 1.5, 'F');

        // Dumbbell icon (simplified)
        doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.circle(23, 17, 1.2, 'F');
        doc.circle(27, 17, 1.2, 'F');
        doc.setLineWidth(0.8);
        doc.setDrawColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.line(23.8, 17, 26.2, 17);

        // Title - Two line layout like the app
        doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('GYM TRACKER', 35, 16);

        doc.setFontSize(7);
        doc.setTextColor(colors.orange[0], colors.orange[1], colors.orange[2]);
        doc.text('PRO', 35, 21);

        // Subtitle
        doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Mis Rutinas de Entrenamiento', 20, 35);

        // Date on right side
        doc.setFontSize(9);
        doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
        const dateStr = new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
        doc.text(dateStr, 190, 35, { align: 'right' });

        // Decorative line
        doc.setDrawColor(colors.gray[0], colors.gray[1], colors.gray[2]);
        doc.setLineWidth(0.3);
        doc.line(20, 42, 190, 42);
      } else {
        // Simplified header for subsequent pages
        doc.setFillColor(colors.orange[0], colors.orange[1], colors.orange[2]);
        doc.roundedRect(20, 15, 8, 8, 1, 1, 'F');

        doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.circle(22.5, 19, 0.8, 'F');
        doc.circle(25.5, 19, 0.8, 'F');
        doc.setLineWidth(0.6);
        doc.setDrawColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.line(23.1, 19, 24.9, 19);

        doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('GYM TRACKER', 32, 18);
        doc.setFontSize(6);
        doc.setTextColor(colors.orange[0], colors.orange[1], colors.orange[2]);
        doc.text('PRO', 32, 22);
      }
    };

    let yPosition = 60;
    let isFirstPage = true;

    drawHeader(true);

    selectedRoutineData.forEach((routine, routineIndex) => {
      // Check if we need a new page for routine header
      if (yPosition > 235) {
        doc.addPage();
        drawHeader(false);
        yPosition = 35;
        isFirstPage = false;
      }

      // Routine card background - subtle border
      const cardStartY = yPosition;
      const dayColor = dayColors[routine.day] || colors.gray;

      // Card border
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.roundedRect(15, yPosition - 2, 180, 16, 2, 2, 'S');

      // Day badge - more compact
      doc.setFillColor(dayColor[0], dayColor[1], dayColor[2]);
      doc.roundedRect(18, yPosition, 28, 9, 2, 2, 'F');
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(routine.day.substring(0, 3).toUpperCase(), 32, yPosition + 6, { align: 'center' });

      // Routine name - bigger and bolder
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(routine.name, 50, yPosition + 7);

      yPosition += 16;

      // Stats bar - more compact and modern
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, yPosition, 180, 10, 1.5, 1.5, 'F');

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      // Duration
      doc.setFont('helvetica', 'bold');
      doc.text(`${routine.duration}`, 20, yPosition + 6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('min', 28, yPosition + 6.5);

      // Exercises count
      doc.setFont('helvetica', 'bold');
      doc.text(`${routine.exercises?.length || 0}`, 75, yPosition + 6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('ejercicios', 83, yPosition + 6.5);

      // Sets total
      const totalSets = routine.exercises?.reduce((sum, ex) => sum + (ex.sets || 0), 0) || 0;
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalSets}`, 140, yPosition + 6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('series', 148, yPosition + 6.5);

      yPosition += 14;

      // Exercises table header - sleeker design
      doc.setFillColor(dayColor[0], dayColor[1], dayColor[2]);
      doc.roundedRect(15, yPosition, 180, 7, 1, 1, 'F');
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('#', 19, yPosition + 5);
      doc.text('EJERCICIO', 30, yPosition + 5);
      doc.text('SERIES', 120, yPosition + 5);
      doc.text('REPS', 145, yPosition + 5);
      doc.text('MÚSCULO', 165, yPosition + 5);

      yPosition += 7;

      // Exercises
      routine.exercises?.forEach((ex, idx) => {
        if (yPosition > 270) {
          doc.addPage();
          drawHeader(false);
          yPosition = 50;
          isFirstPage = false;
        }

        const exercise = getExerciseById(ex.exerciseId);
        if (exercise) {
          // Alternating row background
          if (idx % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, yPosition - 1, 180, 8, 'F');
          }

          doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');

          // Number
          doc.setFont('helvetica', 'bold');
          doc.text(`${idx + 1}`, 18, yPosition + 5);

          // Exercise name
          doc.setFont('helvetica', 'bold');
          const exerciseName = exercise.name.length > 35
            ? exercise.name.substring(0, 32) + '...'
            : exercise.name;
          doc.text(exerciseName, 28, yPosition + 5);

          // Sets
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(dayColor[0], dayColor[1], dayColor[2]);
          doc.text(`${ex.sets}`, 120, yPosition + 5);

          // Reps
          doc.text(`${ex.reps}`, 143, yPosition + 5);

          // Muscle group
          doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
          doc.setFontSize(7);
          const muscleGroup = exercise.muscleGroup.length > 15
            ? exercise.muscleGroup.substring(0, 12) + '...'
            : exercise.muscleGroup;
          doc.text(muscleGroup, 160, yPosition + 5);

          yPosition += 8;
        }
      });

      yPosition += 10;

      // Add spacing between routines
      if (routineIndex < selectedRoutineData.length - 1) {
        doc.setDrawColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
        doc.setLineWidth(0.5);
        doc.line(15, yPosition, 195, yPosition);
        yPosition += 8;
      }
    });

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Footer line
      doc.setDrawColor(colors.orange[0], colors.orange[1], colors.orange[2]);
      doc.setLineWidth(1);
      doc.line(15, 285, 195, 285);

      doc.setFontSize(7);
      doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `🏋️ Generado con GYM TRACKER PRO`,
        105,
        290,
        { align: 'center' }
      );

      // Page number
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.orange[0], colors.orange[1], colors.orange[2]);
      doc.text(`${i}/${pageCount}`, 190, 290, { align: 'right' });
    }

    doc.save(`rutinas-gym-tracker-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Importar/Exportar Rutinas</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'export'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Exportar
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'import'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Importar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Selecciona las rutinas a exportar</h3>
                <div className="space-y-2">
                  {routines.map((routine) => (
                    <label
                      key={routine.id}
                      className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoutines.includes(routine.id)}
                        onChange={() => toggleRoutineSelection(routine.id)}
                        className="w-5 h-5 text-emerald-500 bg-slate-600 border-slate-500 rounded focus:ring-emerald-500"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">{routine.name}</p>
                        <p className="text-slate-400 text-sm">
                          {routine.day} • {routine.exercises?.length || 0} ejercicios
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {selectedRoutines.length > 0 && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={generateExportCode}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      Generar Código
                    </button>
                    <button
                      onClick={exportToPDF}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Exportar a PDF
                    </button>
                  </div>

                  {exportCode && (
                    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium">Código de Exportación</p>
                        <button
                          onClick={copyToClipboard}
                          className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copiar
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={exportCode}
                        readOnly
                        className="w-full h-32 bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-300 text-sm font-mono resize-none"
                      />
                      <p className="text-slate-400 text-xs mt-2">
                        Comparte este código con otros usuarios de GYM TRACKER PRO para que puedan importar tus rutinas.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Pega el código de importación</h3>
                <textarea
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value)}
                  placeholder="Pega aquí el código que te compartieron..."
                  className="w-full h-40 bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  <strong>Nota:</strong> Si importas rutinas para días que ya tienen rutinas asignadas, se te preguntará si deseas reemplazarlas.
                </p>
              </div>

              <button
                onClick={importRoutines}
                disabled={!importCode.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Importar Rutinas
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de Confirmación */}
      <ConfirmDialog {...confirmState} />
    </div>
  );
}
