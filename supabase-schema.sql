-- =====================================================
-- GYM TRACKER PRO - SUPABASE DATABASE SCHEMA
-- =====================================================
-- Ejecuta este script en el SQL Editor de Supabase
-- https://app.supabase.com/project/_/sql
-- =====================================================

-- =====================================================
-- 1. TABLA: profiles
-- =====================================================
-- Extiende la tabla auth.users con datos adicionales del usuario
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text unique not null,
  weight numeric(5,2),
  height numeric(5,2),
  training_goal text check (training_goal in ('strength', 'hypertrophy', 'endurance')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- 2. TABLA: routines
-- =====================================================
-- Plantillas de rutinas de entrenamiento
create table public.routines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  day text not null check (day in ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')),
  exercises jsonb not null, -- Array de RoutineExercise { exerciseId, sets, reps, isSupersetWith }
  duration integer not null, -- Duración estimada en minutos
  is_rest_day boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- 3. TABLA: workouts
-- =====================================================
-- Entrenamientos completados
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  routine_id uuid references public.routines(id) on delete set null,
  routine_name text not null,
  date timestamptz not null,
  exercises jsonb not null, -- Array de WorkoutExercise { exerciseId, sets: [{ reps, weight, completed }], isSupersetWith, notes }
  duration integer not null, -- Duración real en minutos
  notes text,
  rpe integer check (rpe >= 1 and rpe <= 10), -- Rate of Perceived Exertion
  total_volume numeric(10,2), -- Peso total levantado en kg
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- 4. TABLA: rest_days
-- =====================================================
-- Días de descanso planificados
create table public.rest_days (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date timestamptz not null,
  reason text not null check (reason in ('gym-closed', 'active-rest', 'injury', 'personal', 'deload', 'other')),
  notes text,
  created_at timestamptz default now()
);

-- =====================================================
-- 5. TABLA: achievements
-- =====================================================
-- Logros desbloqueados por el usuario
create table public.achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_id text not null, -- ID del logro (ej: 'workout-10', 'volume-50k')
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_id)
);

-- =====================================================
-- 6. TABLA: workout_sessions (sesiones in-progress)
-- =====================================================
-- Entrenamientos en progreso (temporal, 24 horas)
create table public.workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  routine_id text not null,
  routine_name text not null,
  started_at timestamptz not null,
  last_updated timestamptz default now(),
  exercises jsonb not null,
  duration integer not null,
  notes text,
  rpe integer,
  expires_at timestamptz default (now() + interval '24 hours'),
  unique(user_id, routine_id)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
create index idx_workouts_user_date on workouts(user_id, date desc);
create index idx_workouts_user_routine on workouts(user_id, routine_id);
create index idx_routines_user_day on routines(user_id, day);
create index idx_rest_days_user_date on rest_days(user_id, date desc);
create index idx_workout_sessions_expires on workout_sessions(expires_at);
create index idx_achievements_user on achievements(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
alter table profiles enable row level security;
alter table routines enable row level security;
alter table workouts enable row level security;
alter table rest_days enable row level security;
alter table achievements enable row level security;
alter table workout_sessions enable row level security;

-- Políticas para PROFILES
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Políticas para ROUTINES
create policy "Users can view own routines"
  on routines for select
  using (auth.uid() = user_id);

create policy "Users can insert own routines"
  on routines for insert
  with check (auth.uid() = user_id);

create policy "Users can update own routines"
  on routines for update
  using (auth.uid() = user_id);

create policy "Users can delete own routines"
  on routines for delete
  using (auth.uid() = user_id);

-- Políticas para WORKOUTS
create policy "Users can view own workouts"
  on workouts for select
  using (auth.uid() = user_id);

create policy "Users can insert own workouts"
  on workouts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workouts"
  on workouts for update
  using (auth.uid() = user_id);

create policy "Users can delete own workouts"
  on workouts for delete
  using (auth.uid() = user_id);

-- Políticas para REST_DAYS
create policy "Users can view own rest days"
  on rest_days for select
  using (auth.uid() = user_id);

create policy "Users can insert own rest days"
  on rest_days for insert
  with check (auth.uid() = user_id);

create policy "Users can update own rest days"
  on rest_days for update
  using (auth.uid() = user_id);

create policy "Users can delete own rest days"
  on rest_days for delete
  using (auth.uid() = user_id);

-- Políticas para ACHIEVEMENTS
create policy "Users can view own achievements"
  on achievements for select
  using (auth.uid() = user_id);

create policy "Users can insert own achievements"
  on achievements for insert
  with check (auth.uid() = user_id);

-- Políticas para WORKOUT_SESSIONS
create policy "Users can view own sessions"
  on workout_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on workout_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on workout_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on workout_sessions for delete
  using (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers para actualizar updated_at
create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_routines_updated_at
  before update on routines
  for each row execute function update_updated_at_column();

create trigger update_workouts_updated_at
  before update on workouts
  for each row execute function update_updated_at_column();

-- Trigger para crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Limpiar sesiones expiradas (ejecutar vía cron job)
create or replace function cleanup_expired_sessions()
returns void as $$
begin
  delete from workout_sessions where expires_at < now();
end;
$$ language plpgsql;

-- Función para obtener estadísticas del usuario
create or replace function get_user_stats(p_user_id uuid)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'total_workouts', (select count(*) from workouts where user_id = p_user_id),
    'total_volume', (select coalesce(sum(total_volume), 0) from workouts where user_id = p_user_id),
    'total_routines', (select count(*) from routines where user_id = p_user_id),
    'achievements_unlocked', (select count(*) from achievements where user_id = p_user_id)
  ) into result;

  return result;
end;
$$ language plpgsql;

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================

-- Verifica que todo se haya creado correctamente
select
  'Tablas creadas: ' || count(*) as status
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'routines', 'workouts', 'rest_days', 'achievements', 'workout_sessions');
