-- =====================================================
-- CONFIGURACIÓN: Auto-limpieza de Cuenta Demo
-- =====================================================
-- Ejecutar en: https://app.supabase.com/project/ymuqlopycwdqrrmaaaoa/sql
-- =====================================================

-- PASO 1: Limpiar datos actuales de la cuenta demo
-- =====================================================
-- Primero obtener el UUID de la cuenta demo
DO $$
DECLARE
  demo_user_id UUID;
BEGIN
  -- Obtener ID de usuario demo
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = 'demo@gym.com';

  IF demo_user_id IS NOT NULL THEN
    -- Eliminar workouts de demo
    DELETE FROM public.workouts WHERE user_id = demo_user_id;

    -- Eliminar rutinas de demo
    DELETE FROM public.routines WHERE user_id = demo_user_id;

    -- Resetear perfil de demo a valores por defecto
    UPDATE public.profiles
    SET
      weight = 70,
      height = 175,
      training_goal = 'strength',
      updated_at = NOW()
    WHERE id = demo_user_id;

    RAISE NOTICE 'Cuenta demo limpiada: %', demo_user_id;
  ELSE
    RAISE NOTICE 'Cuenta demo no encontrada';
  END IF;
END $$;


-- PASO 2: Crear función para limpiar cuenta demo automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_demo_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demo_user_id UUID;
BEGIN
  -- Obtener ID de usuario demo
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = 'demo@gym.com';

  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'Demo account not found';
    RETURN;
  END IF;

  -- Eliminar workouts de demo
  DELETE FROM public.workouts WHERE user_id = demo_user_id;
  RAISE NOTICE 'Deleted workouts for demo account';

  -- Eliminar rutinas de demo
  DELETE FROM public.routines WHERE user_id = demo_user_id;
  RAISE NOTICE 'Deleted routines for demo account';

  -- Resetear perfil de demo a valores por defecto
  UPDATE public.profiles
  SET
    weight = 70,
    height = 175,
    training_goal = 'strength',
    updated_at = NOW()
  WHERE id = demo_user_id;

  RAISE NOTICE 'Demo account cleaned successfully at %', NOW();
END;
$$;


-- PASO 3: Crear tabla para trackear última limpieza
-- =====================================================
CREATE TABLE IF NOT EXISTS public.demo_cleanup_log (
  id BIGSERIAL PRIMARY KEY,
  cleaned_at TIMESTAMPTZ DEFAULT NOW(),
  workouts_deleted INTEGER DEFAULT 0,
  routines_deleted INTEGER DEFAULT 0
);

-- RLS: Solo admins pueden ver logs
ALTER TABLE demo_cleanup_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access cleanup logs"
  ON demo_cleanup_log
  FOR ALL
  USING (false); -- Nadie puede acceder excepto service role


-- PASO 4: Crear función mejorada con logging
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_demo_account_with_log()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demo_user_id UUID;
  workouts_count INTEGER;
  routines_count INTEGER;
BEGIN
  -- Obtener ID de usuario demo
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = 'demo@gym.com';

  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'Demo account not found';
    RETURN;
  END IF;

  -- Contar antes de eliminar
  SELECT COUNT(*) INTO workouts_count
  FROM public.workouts WHERE user_id = demo_user_id;

  SELECT COUNT(*) INTO routines_count
  FROM public.routines WHERE user_id = demo_user_id;

  -- Eliminar workouts de demo
  DELETE FROM public.workouts WHERE user_id = demo_user_id;

  -- Eliminar rutinas de demo
  DELETE FROM public.routines WHERE user_id = demo_user_id;

  -- Resetear perfil de demo
  UPDATE public.profiles
  SET
    weight = 70,
    height = 175,
    training_goal = 'strength',
    updated_at = NOW()
  WHERE id = demo_user_id;

  -- Guardar log
  INSERT INTO demo_cleanup_log (workouts_deleted, routines_deleted)
  VALUES (workouts_count, routines_count);

  RAISE NOTICE 'Demo account cleaned: % workouts, % routines deleted', workouts_count, routines_count;
END;
$$;


-- PASO 5: Verificar que la función funciona
-- =====================================================
-- Ejecuta esto para probar la limpieza manual:
-- SELECT cleanup_demo_account_with_log();

-- Ver logs de limpieza:
-- SELECT * FROM demo_cleanup_log ORDER BY cleaned_at DESC LIMIT 10;


-- =====================================================
-- CONFIGURAR CRON JOB (Auto-limpieza cada 7 días)
-- =====================================================
-- NOTA: Supabase requiere la extensión pg_cron
-- Primero habilitar la extensión:

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Configurar limpieza automática cada 7 días a las 3:00 AM UTC
SELECT cron.schedule(
  'cleanup-demo-account',           -- Nombre del job
  '0 3 * * 0',                      -- Cada domingo a las 3:00 AM (semanalmente)
  'SELECT cleanup_demo_account_with_log();'
);

-- ALTERNATIVA: Si quieres que sea cada 7 días exactos (no solo domingos):
-- SELECT cron.schedule(
--   'cleanup-demo-account',
--   '0 3 */7 * *',                  -- Cada 7 días a las 3:00 AM
--   'SELECT cleanup_demo_account_with_log();'
-- );


-- =====================================================
-- COMANDOS ÚTILES
-- =====================================================

-- Ver cron jobs activos:
-- SELECT * FROM cron.job;

-- Desactivar el cron job (si es necesario):
-- SELECT cron.unschedule('cleanup-demo-account');

-- Ver historial de ejecuciones del cron:
-- SELECT * FROM cron.job_run_details
-- WHERE jobname = 'cleanup-demo-account'
-- ORDER BY start_time DESC
-- LIMIT 10;

-- Limpiar manualmente la cuenta demo ahora:
-- SELECT cleanup_demo_account_with_log();

-- Ver cuántos datos tiene actualmente la cuenta demo:
-- SELECT
--   (SELECT COUNT(*) FROM workouts WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@gym.com')) as workouts,
--   (SELECT COUNT(*) FROM routines WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@gym.com')) as rutinas;


-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- ✅ Cuenta demo limpiada inmediatamente (PASO 1)
-- ✅ Función de limpieza creada (PASO 2-4)
-- ✅ Cron job configurado para limpiar cada 7 días (PASO 5)
-- ✅ Logs de limpieza guardados en demo_cleanup_log
--
-- La cuenta demo se limpiará automáticamente cada domingo a las 3:00 AM UTC
-- (ajusta el horario en el cron.schedule si lo necesitas diferente)
-- =====================================================
