-- =====================================================
-- FIX: Confirmar TODOS los usuarios para permitir login
-- =====================================================
-- Ejecutar en: https://app.supabase.com/project/ymuqlopycwdqrrmaaaoa/sql
-- =====================================================

-- PASO 1: Ver usuarios actuales y su estado
SELECT
  email,
  email_confirmed_at IS NOT NULL as confirmado,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- PASO 2: Confirmar TODOS los usuarios (esto permitirá hacer login)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- PASO 3: Crear perfiles para usuarios que no tengan
INSERT INTO public.profiles (id, name, email, created_at, updated_at)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.email,
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- PASO 4: Verificar que todo quedó correcto
SELECT
  u.email,
  u.email_confirmed_at IS NOT NULL as puede_loguear,
  p.name as nombre_perfil
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- =====================================================
-- ✅ TODOS los usuarios deberían mostrar puede_loguear = true
-- =====================================================
