-- Enable Realtime for all tables
-- Run these commands in your Supabase SQL Editor

-- Enable Realtime on profiles table
alter publication supabase_realtime add table profiles;

-- Enable Realtime on routines table
alter publication supabase_realtime add table routines;

-- Enable Realtime on workouts table
alter publication supabase_realtime add table workouts;

-- Enable Realtime on rest_days table
alter publication supabase_realtime add table rest_days;

-- Enable Realtime on achievements table
alter publication supabase_realtime add table achievements;

-- Enable Realtime on workout_sessions table (if needed in the future)
alter publication supabase_realtime add table workout_sessions;

-- Verify Realtime is enabled
-- Run this query to see which tables have Realtime enabled:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
