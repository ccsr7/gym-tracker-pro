-- Create custom_exercises table for user-created exercises
-- This allows users to create their own exercises with custom data

CREATE TABLE IF NOT EXISTS custom_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Principiante', 'Intermedio', 'Avanzado')),
  instructions JSONB DEFAULT '[]'::jsonb,
  form_tips JSONB DEFAULT '[]'::jsonb,
  primary_muscles JSONB DEFAULT '[]'::jsonb,
  secondary_muscles JSONB DEFAULT '[]'::jsonb,
  variations JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_custom_exercises_user_id ON custom_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_exercises_category ON custom_exercises(category);

-- Enable Row Level Security
ALTER TABLE custom_exercises ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own custom exercises" ON custom_exercises;
DROP POLICY IF EXISTS "Users can create their own custom exercises" ON custom_exercises;
DROP POLICY IF EXISTS "Users can update their own custom exercises" ON custom_exercises;
DROP POLICY IF EXISTS "Users can delete their own custom exercises" ON custom_exercises;

-- RLS Policy: Users can only view their own custom exercises
CREATE POLICY "Users can view their own custom exercises"
  ON custom_exercises FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can create their own custom exercises
CREATE POLICY "Users can create their own custom exercises"
  ON custom_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own custom exercises
CREATE POLICY "Users can update their own custom exercises"
  ON custom_exercises FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own custom exercises
CREATE POLICY "Users can delete their own custom exercises"
  ON custom_exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_custom_exercises_updated_at ON custom_exercises;

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_custom_exercises_updated_at
  BEFORE UPDATE ON custom_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for custom exercise images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-exercises', 'custom-exercises', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for custom exercise images
DROP POLICY IF EXISTS "Users can upload their own exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own exercise images" ON storage.objects;

CREATE POLICY "Users can upload their own exercise images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'custom-exercises' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own exercise images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'custom-exercises');

CREATE POLICY "Users can update their own exercise images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'custom-exercises' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own exercise images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'custom-exercises' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
