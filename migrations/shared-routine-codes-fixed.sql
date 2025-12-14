-- =====================================================
-- GYM TRACKER PRO - SHARED ROUTINE CODES MIGRATION (FIXED)
-- =====================================================
-- Esta migración añade soporte para compartir rutinas entre usuarios
-- Versión corregida que usa auth.users en lugar de profiles
-- =====================================================

-- Eliminar tabla existente si hay problemas
DROP TABLE IF EXISTS public.shared_routine_codes CASCADE;

-- =====================================================
-- TABLA: shared_routine_codes
-- =====================================================
-- Códigos de exportación persistentes para compartir rutinas entre usuarios
CREATE TABLE public.shared_routine_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,  -- Código de 8 caracteres (ej: "A3F7B2D1")
  routine_data JSONB NOT NULL,  -- Estructura: { version, timestamp, routines: [...] }
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),  -- Expira en 90 días
  usage_count INTEGER DEFAULT 0,  -- Contador de importaciones
  version TEXT DEFAULT '1.0'
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
-- Índice para búsqueda rápida por código (query más común)
CREATE INDEX IF NOT EXISTS idx_shared_codes_code ON public.shared_routine_codes(code);

-- Índice para limpiar códigos expirados
CREATE INDEX IF NOT EXISTS idx_shared_codes_expires ON public.shared_routine_codes(expires_at);

-- Índice para consultar códigos de un usuario específico
CREATE INDEX IF NOT EXISTS idx_shared_codes_user ON public.shared_routine_codes(created_by_user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Habilitar RLS en la tabla
ALTER TABLE public.shared_routine_codes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Anyone can read valid codes" ON public.shared_routine_codes;
DROP POLICY IF EXISTS "Authenticated users can create codes" ON public.shared_routine_codes;
DROP POLICY IF EXISTS "Users can delete own codes" ON public.shared_routine_codes;
DROP POLICY IF EXISTS "System can update usage count" ON public.shared_routine_codes;

-- Política 1: Cualquiera puede leer códigos válidos (no expirados)
-- Esto permite que usuarios no autenticados puedan importar rutinas usando un código
CREATE POLICY "Anyone can read valid codes"
  ON public.shared_routine_codes FOR SELECT
  USING (expires_at > NOW());

-- Política 2: Usuarios autenticados pueden crear códigos
CREATE POLICY "Authenticated users can create codes"
  ON public.shared_routine_codes FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

-- Política 3: Solo el creador puede eliminar sus códigos
CREATE POLICY "Users can delete own codes"
  ON public.shared_routine_codes FOR DELETE
  USING (auth.uid() = created_by_user_id);

-- Política 4: Cualquiera puede actualizar el contador de uso
-- (El contador se incrementa automáticamente al importar)
CREATE POLICY "System can update usage count"
  ON public.shared_routine_codes FOR UPDATE
  USING (true)  -- Permitir actualización desde cualquier contexto
  WITH CHECK (true);

-- =====================================================
-- FUNCIÓN: Limpiar códigos expirados
-- =====================================================
-- Esta función elimina códigos que ya expiraron
DROP FUNCTION IF EXISTS cleanup_expired_codes();

CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.shared_routine_codes
  WHERE expires_at < NOW();

  RAISE NOTICE 'Expired codes cleaned up';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIOS EN LA TABLA
-- =====================================================
COMMENT ON TABLE public.shared_routine_codes IS 'Códigos persistentes para compartir rutinas entre usuarios. Los códigos expiran en 90 días.';
COMMENT ON COLUMN public.shared_routine_codes.code IS 'Código único de 8 caracteres para compartir (ej: A3F7B2D1)';
COMMENT ON COLUMN public.shared_routine_codes.routine_data IS 'JSONB con estructura: { version, timestamp, routines: [...] }';
COMMENT ON COLUMN public.shared_routine_codes.usage_count IS 'Contador de cuántas veces se ha importado este código';
COMMENT ON COLUMN public.shared_routine_codes.expires_at IS 'Fecha de expiración del código (90 días por defecto)';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Verificar que la tabla se creó correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'shared_routine_codes'
  ) THEN
    RAISE NOTICE '✓ Tabla shared_routine_codes creada exitosamente';
  ELSE
    RAISE EXCEPTION '✗ Error: No se pudo crear la tabla shared_routine_codes';
  END IF;
END $$;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
-- Después de ejecutar este script:
-- 1. Los usuarios podrán compartir rutinas con códigos globales
-- 2. Los códigos funcionarán en cualquier dispositivo/usuario
-- 3. Los códigos expirarán automáticamente después de 90 días
-- 4. El sistema rastreará cuántas veces se usa cada código
-- =====================================================
