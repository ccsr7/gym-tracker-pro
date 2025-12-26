-- Row Level Security Policies for custom_exercises table
-- Ejecutar en Supabase SQL Editor si las políticas no existen

-- NOTA: Verificar primero si las políticas ya existen con:
-- SELECT * FROM pg_policies WHERE tablename = 'custom_exercises';

-- Policy para INSERT (crear ejercicios)
CREATE POLICY "Users can create their own exercises"
ON custom_exercises
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy para SELECT (leer ejercicios)
CREATE POLICY "Users can view their own exercises"
ON custom_exercises
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy para UPDATE (editar ejercicios)
CREATE POLICY "Users can update their own exercises"
ON custom_exercises
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy para DELETE (eliminar ejercicios)
CREATE POLICY "Users can delete their own exercises"
ON custom_exercises
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verificar que las políticas se crearon correctamente
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'custom_exercises';
