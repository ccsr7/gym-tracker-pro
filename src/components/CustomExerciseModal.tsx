'use client';

import { useState, useRef } from 'react';
import { X, Upload, Dumbbell, Loader2 } from 'lucide-react';
import { createCustomExercise, uploadCustomExerciseImage } from '@/lib/supabase/services/custom-exercises';
import { supabase } from '@/lib/supabase/client';

interface CustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomExerciseModal({ isOpen, onClose, onSuccess }: CustomExerciseModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pecho');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('');
  const [difficulty, setDifficulty] = useState<'Principiante' | 'Intermedio' | 'Avanzado'>('Principiante');
  const [instructions, setInstructions] = useState('');
  const [formTips, setFormTips] = useState('');
  const [primaryMuscles, setPrimaryMuscles] = useState('');
  const [secondaryMuscles, setSecondaryMuscles] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio'];
  const equipmentOptions = [
    'Barra',
    'Mancuernas',
    'Máquina',
    'Peso Corporal',
    'Cables',
    'Bandas',
    'Kettlebell',
    'TRX',
    'Otro',
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB');
      return;
    }

    setImageFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!muscleGroup.trim()) {
      setError('El grupo muscular es obligatorio');
      return;
    }

    if (!equipment) {
      setError('El equipamiento es obligatorio');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setError('Debes iniciar sesión para crear ejercicios personalizados');
        setIsSubmitting(false);
        return;
      }

      // Upload image if provided
      let imageUrl: string | undefined;
      if (imageFile) {
        console.log('[CustomExerciseModal] Uploading image...');
        const { success, error: uploadError, url } = await uploadCustomExerciseImage(user.id, imageFile);
        if (!success) {
          console.error('[CustomExerciseModal] Image upload failed:', uploadError);
          setError(uploadError || 'Error al subir la imagen');
          setIsSubmitting(false);
          return;
        }
        imageUrl = url;
        console.log('[CustomExerciseModal] Image uploaded successfully:', imageUrl);
      }

      // Create exercise
      console.log('[CustomExerciseModal] Creating exercise...');
      const { success, error: createError, exercise } = await createCustomExercise(user.id, {
        name: name.trim(),
        category,
        muscleGroup: muscleGroup.trim(),
        equipment,
        difficulty,
        instructions: instructions.trim() ? instructions.trim().split('\n').filter(s => s.trim()) : [],
        formTips: formTips.trim() ? formTips.trim().split('\n').filter(s => s.trim()) : [],
        primaryMuscles: primaryMuscles.trim() ? primaryMuscles.trim().split(',').map(s => s.trim()).filter(s => s) : [],
        secondaryMuscles: secondaryMuscles.trim() ? secondaryMuscles.trim().split(',').map(s => s.trim()).filter(s => s) : [],
        imageUrl,
      });

      if (!success) {
        console.error('[CustomExerciseModal] Exercise creation failed:', createError);
        // MEJORADO: Mensaje más específico según el error
        if (createError?.includes('permission')) {
          setError('No tienes permisos para crear ejercicios. Verifica tu configuración de cuenta.');
        } else {
          setError(createError || 'Error al crear el ejercicio');
        }
        setIsSubmitting(false);
        return;
      }

      console.log('[CustomExerciseModal] Exercise created successfully:', exercise);

      // Success!
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('[CustomExerciseModal] Unexpected error creating exercise:', err);
      setError(`Error inesperado: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setName('');
    setCategory('Pecho');
    setMuscleGroup('');
    setEquipment('');
    setDifficulty('Principiante');
    setInstructions('');
    setFormTips('');
    setPrimaryMuscles('');
    setSecondaryMuscles('');
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Dumbbell className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Crear Ejercicio Personalizado</h2>
                <p className="text-sm text-slate-400">Agrega tu propio ejercicio a la biblioteca</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Imagen (Opcional)
            </label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-slate-800">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-emerald-500 transition-colors"
                >
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-xs text-slate-400">Subir imagen</span>
                </button>
              )}
              <div className="flex-1 text-sm text-slate-400">
                <p>Tamaño máximo: 5MB</p>
                <p>Formatos: JPG, PNG, GIF</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Nombre del Ejercicio <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Press de Banca con Pausa"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Category and Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">
                Categoría <span className="text-red-400">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={isSubmitting}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-slate-300 mb-2">
                Dificultad
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Principiante' | 'Intermedio' | 'Avanzado')}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={isSubmitting}
              >
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </div>
          </div>

          {/* Muscle Group and Equipment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="muscleGroup" className="block text-sm font-medium text-slate-300 mb-2">
                Grupo Muscular <span className="text-red-400">*</span>
              </label>
              <input
                id="muscleGroup"
                type="text"
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
                placeholder="Ej: Pectoral"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="equipment" className="block text-sm font-medium text-slate-300 mb-2">
                Equipamiento <span className="text-red-400">*</span>
              </label>
              <select
                id="equipment"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={isSubmitting}
              >
                <option value="">Seleccionar...</option>
                {equipmentOptions.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-slate-300 mb-2">
              Instrucciones (Opcional)
            </label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Escribe cada paso en una línea nueva&#10;Paso 1&#10;Paso 2&#10;Paso 3"
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500 mt-1">Cada línea será un paso</p>
          </div>

          {/* Form Tips */}
          <div>
            <label htmlFor="formTips" className="block text-sm font-medium text-slate-300 mb-2">
              Tips de Forma (Opcional)
            </label>
            <textarea
              id="formTips"
              value={formTips}
              onChange={(e) => setFormTips(e.target.value)}
              placeholder="Escribe cada tip en una línea nueva&#10;Mantén la espalda recta&#10;Controla el movimiento"
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500 mt-1">Cada línea será un tip</p>
          </div>

          {/* Muscles */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="primaryMuscles" className="block text-sm font-medium text-slate-300 mb-2">
                Músculos Principales (Opcional)
              </label>
              <input
                id="primaryMuscles"
                type="text"
                value={primaryMuscles}
                onChange={(e) => setPrimaryMuscles(e.target.value)}
                placeholder="Ej: Pectoral, Tríceps"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-500 mt-1">Separados por comas</p>
            </div>

            <div>
              <label htmlFor="secondaryMuscles" className="block text-sm font-medium text-slate-300 mb-2">
                Músculos Secundarios (Opcional)
              </label>
              <input
                id="secondaryMuscles"
                type="text"
                value={secondaryMuscles}
                onChange={(e) => setSecondaryMuscles(e.target.value)}
                placeholder="Ej: Deltoides, Core"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-500 mt-1">Separados por comas</p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 p-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Ejercicio'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
