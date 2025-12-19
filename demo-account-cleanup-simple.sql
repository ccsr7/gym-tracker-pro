-- =====================================================
-- LIMPIEZA SIMPLE DE CUENTA DEMO (Sin pg_cron)
-- =====================================================
-- Ejecutar en: https://app.supabase.com/project/ymuqlopycwdqrrmaaaoa/sql
-- =====================================================
-- Este script NO requiere extensiones especiales
-- Usa triggers en vez de cron jobs
-- =====================================================

-- PASO 1: Limpiar cuenta demo AHORA
-- =====================================================
DO $$
DECLARE
  demo_user_id UUID;
  workouts_deleted INTEGER;
  routines_deleted INTEGER;
BEGIN
  -- Obtener ID de demo
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = 'demo@gym.com';

  IF demo_user_id IS NOT NULL THEN
    -- Contar antes de borrar
    SELECT COUNT(*) INTO workouts_deleted FROM public.workouts WHERE user_id = demo_user_id;
    SELECT COUNT(*) INTO routines_deleted FROM public.routines WHERE user_id = demo_user_id;

    -- Eliminar datos
    DELETE FROM public.workouts WHERE user_id = demo_user_id;
    DELETE FROM public.routines WHERE user_id = demo_user_id;

    -- Resetear perfil
    UPDATE public.profiles
    SET weight = 70, height = 175, training_goal = 'strength', updated_at = NOW()
    WHERE id = demo_user_id;

    RAISE NOTICE '✅ Cuenta demo limpiada: % workouts, % rutinas eliminadas', workouts_deleted, routines_deleted;
  ELSE
    RAISE NOTICE '❌ Cuenta demo no encontrada';
  END IF;
END $$;


-- PASO 2: Crear función de limpieza automática
-- =====================================================
CREATE OR REPLACE FUNCTION auto_cleanup_demo_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demo_user_id UUID;
  last_workout_date TIMESTAMPTZ;
BEGIN
  -- Obtener ID de demo
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = 'demo@gym.com';

  IF demo_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener fecha del workout más antiguo
  SELECT MIN(date) INTO last_workout_date
  FROM public.workouts
  WHERE user_id = demo_user_id;

  -- Si el workout más antiguo tiene más de 7 días, limpiar todo
  IF last_workout_date IS NOT NULL AND last_workout_date < NOW() - INTERVAL '7 days' THEN
    -- Eliminar workouts viejos (más de 7 días)
    DELETE FROM public.workouts
    WHERE user_id = demo_user_id
    AND date < NOW() - INTERVAL '7 days';

    RAISE NOTICE 'Auto-cleanup: Workouts antiguos eliminados de cuenta demo';
  END IF;

  RETURN NEW;
END;
$$;


-- PASO 3: Crear trigger que limpia al insertar nuevo workout
-- =====================================================
-- Este trigger se ejecuta ANTES de insertar un workout de la cuenta demo
-- Si hay datos viejos (>7 días), los elimina automáticamente

DROP TRIGGER IF EXISTS trigger_cleanup_demo_on_insert ON public.workouts;

CREATE TRIGGER trigger_cleanup_demo_on_insert
  BEFORE INSERT ON public.workouts
  FOR EACH ROW
  WHEN (NEW.user_id = (SELECT id FROM auth.users WHERE email = 'demo@gym.com'))
  EXECUTE FUNCTION auto_cleanup_demo_data();


-- PASO 4: Crear función manual de limpieza (para testing)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_demo_now()
RETURNS TABLE(
  workouts_deleted INTEGER,
  routines_deleted INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demo_user_id UUID;
  w_count INTEGER;
  r_count INTEGER;
BEGIN
  -- Obtener ID de demo
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = 'demo@gym.com';

  IF demo_user_id IS NULL THEN
    RETURN QUERY SELECT 0, 0, 'Demo account not found'::TEXT;
    RETURN;
  END IF;

  -- Contar antes de borrar
  SELECT COUNT(*) INTO w_count FROM public.workouts WHERE user_id = demo_user_id;
  SELECT COUNT(*) INTO r_count FROM public.routines WHERE user_id = demo_user_id;

  -- Eliminar todo
  DELETE FROM public.workouts WHERE user_id = demo_user_id;
  DELETE FROM public.routines WHERE user_id = demo_user_id;

  -- Resetear perfil
  UPDATE public.profiles
  SET weight = 70, height = 175, training_goal = 'strength', updated_at = NOW()
  WHERE id = demo_user_id;

  RETURN QUERY SELECT w_count, r_count, 'Demo account cleaned successfully'::TEXT;
END;
$$;


-- =====================================================
-- COMANDOS ÚTILES
-- =====================================================

-- Limpiar manualmente la cuenta demo ahora:
-- SELECT * FROM cleanup_demo_now();

-- Ver cuántos datos tiene actualmente la cuenta demo:
-- SELECT
--   (SELECT COUNT(*) FROM workouts WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@gym.com')) as workouts,
--   (SELECT COUNT(*) FROM routines WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@gym.com')) as rutinas;

-- Ver workouts de la cuenta demo:
-- SELECT w.id, w.date, r.name as routine_name, w.created_at
-- FROM workouts w
-- LEFT JOIN routines r ON w.routine_id = r.id
-- WHERE w.user_id = (SELECT id FROM auth.users WHERE email = 'demo@gym.com')
-- ORDER BY w.date DESC;


-- =====================================================
-- ¿CÓMO FUNCIONA LA AUTO-LIMPIEZA?
-- =====================================================
-- El trigger se ejecuta CADA VEZ que alguien usa la cuenta demo
-- y crea un nuevo workout. Si hay workouts de más de 7 días,
-- se eliminan automáticamente.
--
-- Esto significa que:
-- - ✅ Si nadie usa la cuenta demo por 7+ días, queda con datos viejos (pero no importa)
-- - ✅ Cuando alguien USE la cuenta demo y agregue un workout, se limpian los datos viejos
-- - ✅ No requiere cron jobs ni extensiones especiales
-- - ✅ Funciona en cualquier plan de Supabase (incluso free tier)
--
-- VENTAJAS:
-- - Simple y confiable
-- - No requiere mantenimiento
-- - Se limpia cuando realmente importa (cuando alguien la usa)
-- =====================================================
