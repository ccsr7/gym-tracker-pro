-- =====================================================
-- VERIFICAR Y ARREGLAR USUARIO
-- =====================================================
-- Ejecutar en: https://app.supabase.com/project/ymuqlopycwdqrrmaaaoa/sql
-- =====================================================

-- 1. Verificar qué usuarios existen y su estado
SELECT
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Confirmar TODOS los usuarios que no están confirmados
-- NOTA: confirmed_at es columna generada, solo actualizamos email_confirmed_at
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 3. Verificar perfiles asociados
SELECT
  p.id,
  p.name,
  p.email,
  u.email as auth_email,
  u.email_confirmed_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 5;

-- 4. Crear perfil si no existe para usuarios sin perfil
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

-- 5. Resultado final - Verificar que todo esté correcto
SELECT
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.confirmed_at IS NOT NULL as account_confirmed,
  p.name IS NOT NULL as has_profile,
  p.name as profile_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Deberías ver que TODOS los usuarios tienen:
-- - email_confirmed = true
-- - account_confirmed = true
-- - has_profile = true
-- - profile_name con un valor (no NULL)
-- =====================================================
