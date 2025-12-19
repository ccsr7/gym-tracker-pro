-- =====================================================
-- CREATE DEMO USER FOR GYM TRACKER PRO
-- =====================================================
-- Este script crea la cuenta demo en Supabase para testing
-- Ejecutar en: https://app.supabase.com/project/ymuqlopycwdqrrmaaaoa/sql
-- =====================================================

-- 1. Crear usuario en auth.users con email confirmado
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'demo@gym.com',
  crypt('demo123', gen_salt('bf')),  -- Password: demo123
  NOW(),  -- Email confirmado inmediatamente
  NOW(),  -- Account confirmada
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Usuario Demo"}'::jsonb,
  'authenticated',
  'authenticated'
)
ON CONFLICT (email) DO NOTHING;  -- Si ya existe, no hacer nada

-- 2. Crear perfil en public.profiles
-- El trigger debería crear esto automáticamente, pero lo hacemos manualmente por si acaso
INSERT INTO public.profiles (
  id,
  name,
  email,
  weight,
  height,
  training_goal,
  created_at,
  updated_at
)
SELECT
  id,
  'Usuario Demo',
  'demo@gym.com',
  70,
  175,
  'strength',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'demo@gym.com'
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  weight = EXCLUDED.weight,
  height = EXCLUDED.height,
  training_goal = EXCLUDED.training_goal,
  updated_at = NOW();

-- 3. Verificar que el usuario fue creado correctamente
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  p.name,
  p.training_goal
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'demo@gym.com';

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Deberías ver una fila con:
-- - email: demo@gym.com
-- - email_confirmed_at: (fecha actual)
-- - name: Usuario Demo
-- - training_goal: strength
--
-- Ahora puedes hacer login con:
-- Email: demo@gym.com
-- Password: demo123
-- =====================================================
