-- SYS WMS Pro: Multi-Tenant Authentication & Row Level Security Migration
-- INSTRUCTIONS: Copy and paste this entire script into your Supabase SQL Editor and click "Run".

-- 1. Create the Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_code TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Allow users to view and update ONLY their own company profile
CREATE POLICY "Users can view their own company profile" 
  ON public.companies FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own company profile" 
  ON public.companies FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own company profile" 
  ON public.companies FOR UPDATE 
  USING (auth.uid() = id);

-- 2. Clean Up Legacy Public Security Policies
-- Since we are moving to a strict secure multi-tenant architecture, we MUST delete the old insecure "allow all" policies.
DROP POLICY IF EXISTS "Allow public all on workers" ON public.workers;
DROP POLICY IF EXISTS "Allow public all on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow public all on cash_advance" ON public.cash_advance;


-- 3. Add Company_ID to existing tables enforcing Multi-Tenant Isolation
-- NOTE: We allow NULL initially so existing data isn't deleted immediately, 
-- but we set the DEFAULT to auth.uid() so all future frontend Javascript inserts automatically get the correct company_id without needing code changes!

ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE public.cash_advance ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE DEFAULT auth.uid();

-- 4. Enable RLS on all operational tables
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_advance ENABLE ROW LEVEL SECURITY;

-- 5. Create Strict Isolation Policies
-- Workers Table
CREATE POLICY "Company isolation for workers (SELECT)" ON public.workers FOR SELECT USING (auth.uid() = company_id);
CREATE POLICY "Company isolation for workers (INSERT)" ON public.workers FOR INSERT WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Company isolation for workers (UPDATE)" ON public.workers FOR UPDATE USING (auth.uid() = company_id);
CREATE POLICY "Company isolation for workers (DELETE)" ON public.workers FOR DELETE USING (auth.uid() = company_id);

-- Attendance Table
CREATE POLICY "Company isolation for attendance (SELECT)" ON public.attendance FOR SELECT USING (auth.uid() = company_id);
CREATE POLICY "Company isolation for attendance (INSERT)" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Company isolation for attendance (UPDATE)" ON public.attendance FOR UPDATE USING (auth.uid() = company_id);
CREATE POLICY "Company isolation for attendance (DELETE)" ON public.attendance FOR DELETE USING (auth.uid() = company_id);

-- Cash Advance Table
CREATE POLICY "Company isolation for cash_advance (SELECT)" ON public.cash_advance FOR SELECT USING (auth.uid() = company_id);
CREATE POLICY "Company isolation for cash_advance (INSERT)" ON public.cash_advance FOR INSERT WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Company isolation for cash_advance (UPDATE)" ON public.cash_advance FOR UPDATE USING (auth.uid() = company_id);
CREATE POLICY "Company isolation for cash_advance (DELETE)" ON public.cash_advance FOR DELETE USING (auth.uid() = company_id);

-- SUCCESS: Your database is now a secure, multi-tenant architecture!
