-- Migración: Sistema Híbrido de Rutinas Programadas + Plantillas
-- Ejecutar en Supabase SQL Editor

-- PASO 1: Hacer columna 'day' nullable
ALTER TABLE routines
ALTER COLUMN day DROP NOT NULL;

-- PASO 2: Agregar columna is_template (default false para rutinas existentes)
ALTER TABLE routines
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- PASO 3: Agregar columna description
ALTER TABLE routines
ADD COLUMN IF NOT EXISTS description TEXT;

-- PASO 4: Actualizar rutinas existentes - todas son rutinas programadas
UPDATE routines
SET is_template = FALSE
WHERE is_template IS NULL;

-- PASO 5: Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_routines_is_template ON routines(user_id, is_template);
CREATE INDEX IF NOT EXISTS idx_routines_day ON routines(user_id, day) WHERE day IS NOT NULL;

-- PASO 6: Agregar comentarios para documentación
COMMENT ON COLUMN routines.day IS 'Día de la semana para rutinas programadas. NULL para plantillas reutilizables.';
COMMENT ON COLUMN routines.is_template IS 'true = plantilla reutilizable, false/undefined = rutina programada por día';
COMMENT ON COLUMN routines.description IS 'Descripción opcional de la plantilla (para ayudar a recordar su propósito)';

-- VERIFICACIÓN: Ver estructura actualizada
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'routines'
ORDER BY ordinal_position;

-- VERIFICACIÓN: Contar rutinas programadas vs plantillas
SELECT
    is_template,
    COUNT(*) as total,
    COUNT(CASE WHEN day IS NOT NULL THEN 1 END) as con_dia,
    COUNT(CASE WHEN day IS NULL THEN 1 END) as sin_dia
FROM routines
GROUP BY is_template;
