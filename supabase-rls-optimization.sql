-- =====================================================
-- OPTIMIZACIÓN DE POLÍTICAS RLS PARA MEJOR RENDIMIENTO
-- =====================================================
-- Este script reemplaza las políticas RLS para usar (select auth.uid())
-- en lugar de auth.uid() para mejorar el rendimiento ~100x
--
-- Ejecutar este script en Supabase SQL Editor para aplicar las optimizaciones
-- =====================================================

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- ROUTINES
DROP POLICY IF EXISTS "Users can view own routines" ON routines;
DROP POLICY IF EXISTS "Users can insert own routines" ON routines;
DROP POLICY IF EXISTS "Users can update own routines" ON routines;
DROP POLICY IF EXISTS "Users can delete own routines" ON routines;

CREATE POLICY "Users can view own routines" ON routines
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own routines" ON routines
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own routines" ON routines
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own routines" ON routines
  FOR DELETE USING ((select auth.uid()) = user_id);

-- WORKOUTS
DROP POLICY IF EXISTS "Users can view own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can insert own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can update own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can delete own workouts" ON workouts;

CREATE POLICY "Users can view own workouts" ON workouts
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own workouts" ON workouts
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own workouts" ON workouts
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own workouts" ON workouts
  FOR DELETE USING ((select auth.uid()) = user_id);

-- REST_DAYS
DROP POLICY IF EXISTS "Users can view own rest days" ON rest_days;
DROP POLICY IF EXISTS "Users can insert own rest days" ON rest_days;
DROP POLICY IF EXISTS "Users can update own rest days" ON rest_days;
DROP POLICY IF EXISTS "Users can delete own rest days" ON rest_days;

CREATE POLICY "Users can view own rest days" ON rest_days
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own rest days" ON rest_days
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own rest days" ON rest_days
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own rest days" ON rest_days
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ACHIEVEMENTS
DROP POLICY IF EXISTS "Users can view own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON achievements;

CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- WORKOUT_SESSIONS
DROP POLICY IF EXISTS "Users can view own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON workout_sessions;

CREATE POLICY "Users can view own sessions" ON workout_sessions
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own sessions" ON workout_sessions
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own sessions" ON workout_sessions
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own sessions" ON workout_sessions
  FOR DELETE USING ((select auth.uid()) = user_id);

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
-- Después de ejecutar este script, los 22 warnings de Supabase
-- deberían desaparecer y las queries serán mucho más rápidas.
-- =====================================================
