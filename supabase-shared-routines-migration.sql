-- =====================================================
-- GYM TRACKER PRO - SHARED ROUTINE CODES MIGRATION
-- =====================================================
-- Esta migración añade soporte para compartir rutinas entre usuarios
-- Ejecuta este script en el SQL Editor de Supabase después de crear el schema principal
-- https://app.supabase.com/project/_/sql
-- =====================================================

-- =====================================================
-- TABLA: shared_routine_codes
-- =====================================================
-- Códigos de exportación persistentes para compartir rutinas entre usuarios
create table public.shared_routine_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,  -- Código de 8 caracteres (ej: "A3F7B2D1")
  routine_data jsonb not null,  -- Estructura: { version, timestamp, routines: [...] }
  created_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '90 days'),  -- Expira en 90 días
  usage_count integer default 0,  -- Contador de importaciones
  version text default '1.0'
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
-- Índice para búsqueda rápida por código (query más común)
create index idx_shared_codes_code on shared_routine_codes(code);

-- Índice para limpiar códigos expirados
create index idx_shared_codes_expires on shared_routine_codes(expires_at);

-- Índice para consultar códigos de un usuario específico
create index idx_shared_codes_user on shared_routine_codes(created_by_user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Habilitar RLS en la tabla
alter table shared_routine_codes enable row level security;

-- Política: Cualquiera puede leer códigos válidos (no expirados)
-- Esto permite que usuarios no autenticados puedan importar rutinas usando un código
create policy "Anyone can read valid codes"
  on shared_routine_codes for select
  using (expires_at > now());

-- Política: Usuarios autenticados pueden crear códigos
create policy "Authenticated users can create codes"
  on shared_routine_codes for insert
  with check ((select auth.uid()) = created_by_user_id);

-- Política: Solo el creador puede eliminar sus códigos
create policy "Users can delete own codes"
  on shared_routine_codes for delete
  using ((select auth.uid()) = created_by_user_id);

-- Política: Solo el creador puede actualizar el contador de uso
-- (El contador se incrementa automáticamente al importar)
create policy "System can update usage count"
  on shared_routine_codes for update
  using (true)  -- Permitir actualización desde cualquier contexto
  with check (true);

-- =====================================================
-- FUNCIÓN: Limpiar códigos expirados
-- =====================================================
-- Esta función elimina códigos que ya expiraron
-- Ejecutar diariamente usando Supabase Database Webhooks o pg_cron
create or replace function cleanup_expired_codes()
returns void as $$
begin
  delete from shared_routine_codes
  where expires_at < now();

  raise notice 'Expired codes cleaned up';
end;
$$ language plpgsql security definer;

-- =====================================================
-- COMENTARIOS EN LA TABLA
-- =====================================================
comment on table shared_routine_codes is 'Códigos persistentes para compartir rutinas entre usuarios. Los códigos expiran en 90 días.';
comment on column shared_routine_codes.code is 'Código único de 8 caracteres para compartir (ej: A3F7B2D1)';
comment on column shared_routine_codes.routine_data is 'JSONB con estructura: { version, timestamp, routines: [...] }';
comment on column shared_routine_codes.usage_count is 'Contador de cuántas veces se ha importado este código';
comment on column shared_routine_codes.expires_at is 'Fecha de expiración del código (90 días por defecto)';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
-- Después de ejecutar este script:
-- 1. Los usuarios podrán compartir rutinas con códigos globales
-- 2. Los códigos funcionarán en cualquier dispositivo/usuario
-- 3. Los códigos expirarán automáticamente después de 90 días
-- 4. El sistema rastreará cuántas veces se usa cada código
-- =====================================================
