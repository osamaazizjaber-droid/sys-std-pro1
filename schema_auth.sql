-- SYS STD Pro: Multi-Tenant Authentication & Row Level Security Migration
-- INSTRUCTIONS: Copy and paste this entire script into your Supabase SQL Editor and click "Run".

-- 1. Create the Colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  college_code TEXT UNIQUE NOT NULL,
  college_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Colleges table
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- Allow users to view and update ONLY their own college profile
CREATE POLICY "Users can view their own college profile" 
  ON public.colleges FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own college profile" 
  ON public.colleges FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own college profile" 
  ON public.colleges FOR UPDATE 
  USING (auth.uid() = id);

-- 2. Clean Up Legacy Public Security Policies
-- Since we are moving to a strict secure multi-tenant architecture, we MUST delete the old insecure "allow all" policies.
DROP POLICY IF EXISTS "Allow public all on students" ON public.students;
DROP POLICY IF EXISTS "Allow public all on professors" ON public.professors;
DROP POLICY IF EXISTS "Allow public all on attendance" ON public.attendance;

-- 3. Add College_ID to existing tables enforcing Multi-Tenant Isolation
-- NOTE: We allow NULL initially so existing data isn't deleted immediately, 
-- but we set the DEFAULT to auth.uid() so all future frontend Javascript inserts automatically get the correct college_id without needing code changes!

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE public.professors ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE DEFAULT auth.uid();

-- 4. Enable RLS on all operational tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- 5. Create Strict Isolation Policies
-- Students Table
CREATE POLICY "College isolation for students (SELECT)" ON public.students FOR SELECT USING (auth.uid() = college_id);
CREATE POLICY "College isolation for students (INSERT)" ON public.students FOR INSERT WITH CHECK (auth.uid() = college_id);
CREATE POLICY "College isolation for students (UPDATE)" ON public.students FOR UPDATE USING (auth.uid() = college_id);
CREATE POLICY "College isolation for students (DELETE)" ON public.students FOR DELETE USING (auth.uid() = college_id);

-- Professors Table
CREATE POLICY "College isolation for professors (SELECT)" ON public.professors FOR SELECT USING (auth.uid() = college_id);
CREATE POLICY "College isolation for professors (INSERT)" ON public.professors FOR INSERT WITH CHECK (auth.uid() = college_id);
CREATE POLICY "College isolation for professors (UPDATE)" ON public.professors FOR UPDATE USING (auth.uid() = college_id);
CREATE POLICY "College isolation for professors (DELETE)" ON public.professors FOR DELETE USING (auth.uid() = college_id);

-- Attendance Table
CREATE POLICY "College isolation for attendance (SELECT)" ON public.attendance FOR SELECT USING (auth.uid() = college_id);
CREATE POLICY "College isolation for attendance (INSERT)" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = college_id);
CREATE POLICY "College isolation for attendance (UPDATE)" ON public.attendance FOR UPDATE USING (auth.uid() = college_id);
CREATE POLICY "College isolation for attendance (DELETE)" ON public.attendance FOR DELETE USING (auth.uid() = college_id);

-- SUCCESS: Your database is now a secure, multi-tenant architecture!
