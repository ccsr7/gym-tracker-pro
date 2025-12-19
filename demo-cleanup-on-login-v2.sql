-- =====================================================
-- AUTO-LIMPIEZA DE CUENTA DEMO AL HACER LOGIN (v2 - Idempotente)
-- =====================================================
-- Ejecutar en: https://app.supabase.com/project/ymuqlopycwdqrrmaaaoa/sql
-- =====================================================
-- Esta versión puede ejecutarse múltiples veces sin errores
-- =====================================================

-- PASO 1: Limpiar cuenta demo AHORA (ejecutar una vez)
-- =====================================================
DO $$
DECLARE
  demo_user_id UUID;
BEGIN
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@gym.com';

  IF demo_user_id IS NOT NULL THEN
    DELETE FROM public.workouts WHERE user_id = demo_user_id;
    DELETE FROM public.routines WHERE user_id = demo_user_id;
    UPDATE public.profiles
    SET weight = 70, height = 175, training_goal = 'strength', updated_at = NOW()
    WHERE id = demo_user_id;

    RAISE NOTICE '✅ Cuenta demo limpiada';
  END IF;
END $$;


-- PASO 2: Crear tabla de seguimiento de última limpieza
-- =====================================================
CREATE TABLE IF NOT EXISTS public.demo_last_cleanup (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_cleaned_at TIMESTAMPTZ,
  CONSTRAINT only_one_row CHECK (id = 1)
);

-- Insertar registro inicial (o actualizar si existe)
INSERT INTO public.demo_last_cleanup (id, last_cleaned_at)
VALUES (1, NOW())
ON CONFLICT (id) DO UPDATE
SET last_cleaned_at = NOW();

-- RLS: Cualquiera puede leer, nadie puede modificar (solo triggers)
ALTER TABLE demo_last_cleanup ENABLE ROW LEVEL SECURITY;

-- Eliminar política si existe antes de crearla
DROP POLICY IF EXISTS "Anyone can read cleanup time" ON demo_last_cleanup;

CREATE POLICY "Anyone can read cleanup time"
  ON demo_last_cleanup FOR SELECT
  USING (true);


-- PASO 3: Función para verificar si necesita limpieza
-- =====================================================
CREATE OR REPLACE FUNCTION should_cleanup_demo()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_cleanup TIMESTAMPTZ;
BEGIN
  SELECT last_cleaned_at INTO last_cleanup
  FROM public.demo_last_cleanup
  WHERE id = 1;

  -- Si nunca se limpió o fue hace más de 7 días
  IF last_cleanup IS NULL OR last_cleanup < NOW() - INTERVAL '7 days' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;


-- PASO 4: Función que limpia la cuenta demo
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_demo_account_smart()
RETURNS TABLE(
  cleaned BOOLEAN,
  workouts_deleted INTEGER,
  routines_deleted INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demo_user_id UUID;
  w_count INTEGER := 0;
  r_count INTEGER := 0;
  needs_cleanup BOOLEAN;
BEGIN
  -- Verificar si necesita limpieza
  SELECT should_cleanup_demo() INTO needs_cleanup;

  IF NOT needs_cleanup THEN
    RETURN QUERY SELECT FALSE, 0, 0;
    RETURN;
  END IF;

  -- Obtener ID de demo
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@gym.com';

  IF demo_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 0;
    RETURN;
  END IF;

  -- Contar antes de borrar
  SELECT COUNT(*) INTO w_count FROM public.workouts WHERE user_id = demo_user_id;
  SELECT COUNT(*) INTO r_count FROM public.routines WHERE user_id = demo_user_id;

  -- Solo limpiar si hay datos
  IF w_count > 0 OR r_count > 0 THEN
    DELETE FROM public.workouts WHERE user_id = demo_user_id;
    DELETE FROM public.routines WHERE user_id = demo_user_id;

    UPDATE public.profiles
    SET weight = 70, height = 175, training_goal = 'strength', updated_at = NOW()
    WHERE id = demo_user_id;

    -- Actualizar última limpieza
    UPDATE public.demo_last_cleanup
    SET last_cleaned_at = NOW()
    WHERE id = 1;

    RETURN QUERY SELECT TRUE, w_count, r_count;
  ELSE
    -- No había datos, solo actualizar timestamp
    UPDATE public.demo_last_cleanup
    SET last_cleaned_at = NOW()
    WHERE id = 1;

    RETURN QUERY SELECT FALSE, 0, 0;
  END IF;
END;
$$;


-- =====================================================
-- VERIFICACIÓN - Confirmar que todo está funcionando
-- =====================================================

-- 1. Verificar que la tabla existe
SELECT 'demo_last_cleanup table' as check_name,
       EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'demo_last_cleanup') as exists;

-- 2. Verificar que las funciones existen
SELECT 'should_cleanup_demo function' as check_name,
       EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'should_cleanup_demo') as exists;

SELECT 'cleanup_demo_account_smart function' as check_name,
       EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_demo_account_smart') as exists;

-- 3. Ver estado actual
SELECT
  last_cleaned_at,
  EXTRACT(DAY FROM (NOW() - last_cleaned_at)) as dias_desde_limpieza,
  should_cleanup_demo() as necesita_limpieza
FROM demo_last_cleanup;

-- 4. Ver datos actuales de la cuenta demo
SELECT
  (SELECT COUNT(*) FROM workouts WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@gym.com')) as workouts_count,
  (SELECT COUNT(*) FROM routines WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@gym.com')) as routines_count;


-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Deberías ver:
-- ✅ demo_last_cleanup table | exists: true
-- ✅ should_cleanup_demo function | exists: true
-- ✅ cleanup_demo_account_smart function | exists: true
-- ✅ last_cleaned_at con fecha de hoy
-- ✅ necesita_limpieza = false (porque acabamos de limpiar)
-- ✅ workouts_count = 0
-- ✅ routines_count = 0
-- =====================================================


-- =====================================================
-- COMANDOS ÚTILES (COPIAR/PEGAR CUANDO NECESITES)
-- =====================================================

-- Verificar si necesita limpieza:
-- SELECT should_cleanup_demo();

-- Limpiar manualmente (solo si pasaron 7 días):
-- SELECT * FROM cleanup_demo_account_smart();

-- Forzar limpieza inmediata (para testing):
-- UPDATE demo_last_cleanup SET last_cleaned_at = NOW() - INTERVAL '8 days' WHERE id = 1;
-- SELECT * FROM cleanup_demo_account_smart();

-- Ver última limpieza:
-- SELECT * FROM demo_last_cleanup;

-- Ver datos de cuenta demo:
-- SELECT
--   (SELECT COUNT(*) FROM workouts WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@gym.com')) as workouts,
--   (SELECT COUNT(*) FROM routines WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@gym.com')) as rutinas;
-- =====================================================
