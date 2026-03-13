
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('faculty', 'student');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 3. Create has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Add auth_id to faculty
ALTER TABLE public.faculty ADD COLUMN auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Add auth_id to students
ALTER TABLE public.students ADD COLUMN auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Drop password column from faculty (migrating to Supabase Auth)
ALTER TABLE public.faculty DROP COLUMN password;

-- 7. Drop ALL existing permissive RLS policies
DROP POLICY IF EXISTS "Public insert attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Public read attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Public insert faculty" ON public.faculty;
DROP POLICY IF EXISTS "Public read faculty" ON public.faculty;
DROP POLICY IF EXISTS "Public update faculty" ON public.faculty;
DROP POLICY IF EXISTS "Public insert lectures" ON public.lectures;
DROP POLICY IF EXISTS "Public read lectures" ON public.lectures;
DROP POLICY IF EXISTS "Public update lectures" ON public.lectures;
DROP POLICY IF EXISTS "Public delete students" ON public.students;
DROP POLICY IF EXISTS "Public insert students" ON public.students;
DROP POLICY IF EXISTS "Public read students" ON public.students;
DROP POLICY IF EXISTS "Public update students" ON public.students;

-- 8. Faculty table policies
-- Faculty can read own record only
CREATE POLICY "Faculty can read own record"
  ON public.faculty FOR SELECT
  TO authenticated
  USING (auth_id = (SELECT auth.uid()));

-- Faculty can update own record
CREATE POLICY "Faculty can update own record"
  ON public.faculty FOR UPDATE
  TO authenticated
  USING (auth_id = (SELECT auth.uid()));

-- 9. Students table policies
-- Faculty can read all students, students can read own record
CREATE POLICY "Authenticated users can read students"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    public.has_role((SELECT auth.uid()), 'faculty')
    OR auth_id = (SELECT auth.uid())
  );

-- Only faculty can insert students
CREATE POLICY "Faculty can insert students"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role((SELECT auth.uid()), 'faculty'));

-- Only faculty can update students
CREATE POLICY "Faculty can update students"
  ON public.students FOR UPDATE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'faculty'));

-- Only faculty can delete students
CREATE POLICY "Faculty can delete students"
  ON public.students FOR DELETE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'faculty'));

-- 10. Lectures table policies
-- Authenticated users can read lectures
CREATE POLICY "Authenticated users can read lectures"
  ON public.lectures FOR SELECT
  TO authenticated
  USING (true);

-- Only the owning faculty can insert lectures
CREATE POLICY "Faculty can insert lectures"
  ON public.lectures FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role((SELECT auth.uid()), 'faculty')
    AND faculty_id IN (SELECT id FROM public.faculty WHERE auth_id = (SELECT auth.uid()))
  );

-- Only the owning faculty can update lectures
CREATE POLICY "Faculty can update own lectures"
  ON public.lectures FOR UPDATE
  TO authenticated
  USING (
    faculty_id IN (SELECT id FROM public.faculty WHERE auth_id = (SELECT auth.uid()))
  );

-- 11. Attendance table policies
-- Faculty can read all, students can read own
CREATE POLICY "Users can read relevant attendance"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (
    public.has_role((SELECT auth.uid()), 'faculty')
    OR student_id IN (SELECT id FROM public.students WHERE auth_id = (SELECT auth.uid()))
  );

-- No direct INSERT policy: attendance inserts go through edge function using service role
-- This prevents client-side attendance forgery
