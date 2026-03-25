-- scanner_rpc.sql
-- INSTRUCTIONS: Run this script precisely once in your Supabase SQL Editor to enable secure mobile scanning.

-- RPC 1: Safely retrieve the student name for the viewfinder confirmation UI
CREATE OR REPLACE FUNCTION get_scanner_student_info(
    p_college_code TEXT,
    p_student_id TEXT
) RETURNS TEXT AS $$
DECLARE
    v_college_id UUID;
    v_student_name TEXT;
BEGIN
    -- Force uppercase and trim spaces
    SELECT id INTO v_college_id FROM public.colleges WHERE trim(upper(college_code)) = trim(upper(p_college_code));
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid College Code';
    END IF;

    SELECT student_name INTO v_student_name FROM public.students WHERE college_id = v_college_id AND trim(lower(student_id)) = trim(lower(p_student_id));
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found';
    END IF;

    RETURN v_student_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC 2: Log the attendance securely from the mobile scanner
CREATE OR REPLACE FUNCTION log_scanner_attendance(
    p_college_code TEXT,
    p_action_mode TEXT, -- Deprecated payload receiver to avoid app breakage
    p_student_id TEXT, -- e.g. "std00xx"
    p_prof_id TEXT DEFAULT NULL,
    p_subject TEXT DEFAULT 'General'
) RETURNS JSON AS $$
DECLARE
    v_college_id UUID;
    v_student RECORD;
    v_prof RECORD;
    v_scan_date DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Baghdad')::DATE;
    v_scan_time TEXT := to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Baghdad', 'HH12:MI AM');
    v_attendance RECORD;
BEGIN
    -- 1. Ensure the user's mobile device is authorized with a valid College Code
    SELECT id INTO v_college_id FROM public.colleges WHERE trim(upper(college_code)) = trim(upper(p_college_code));
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid College Code. Please re-login on the scanner.';
    END IF;

    -- 2. Locate the student
    SELECT * INTO v_student FROM public.students WHERE college_id = v_college_id AND trim(lower(student_id)) = trim(lower(p_student_id));
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found matching this ID for your college.';
    END IF;

    -- 3. Optional: Locate the professor
    IF p_prof_id IS NOT NULL THEN
        SELECT * INTO v_prof FROM public.professors WHERE college_id = v_college_id AND trim(lower(prof_id)) = trim(lower(p_prof_id));
    END IF;

    -- 4. Check the student's attendance record for today (and subject and prof)
    SELECT * INTO v_attendance FROM public.attendance 
    WHERE college_id = v_college_id AND trim(lower(student_id)) = trim(lower(v_student.student_id)) AND date = v_scan_date AND trim(lower(subject)) = trim(lower(p_subject)) AND (p_prof_id IS NULL OR trim(lower(prof_id)) = trim(lower(p_prof_id))) LIMIT 1;

    -- 5. Process Logging Logic
    IF FOUND THEN
        RAISE EXCEPTION '% is already logged today for this subject.', v_student.student_name;
    ELSE
        -- Log 1-Time presence
        INSERT INTO public.attendance (college_id, student_id, student_name, prof_id, prof_name, date, subject, grade, status, check_in, notes)
        VALUES (v_college_id, v_student.student_id, v_student.student_name, v_prof.prof_id, v_prof.prof_name, v_scan_date, p_subject, v_student.grade, 'Present', v_scan_time, 'Mobile Scanner');
        
        RETURN json_build_object('status', 'success', 'student_name', v_student.student_name, 'action', 'Logged', 'time', v_scan_time);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC 3: Pre-Authenticate the Scanner Device
CREATE OR REPLACE FUNCTION verify_scanner_code(
    p_college_code TEXT
) RETURNS JSON AS $$
DECLARE
    v_college RECORD;
BEGIN
    -- Bypass RLS to verify if the code exists
    SELECT id, college_name INTO v_college FROM public.colleges WHERE trim(upper(college_code)) = trim(upper(p_college_code));
    
    IF NOT FOUND THEN
        RETURN json_build_object('valid', false);
    END IF;
    
    RETURN json_build_object('valid', true, 'college_name', v_college.college_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 4: Get Professor Config for Scanner
CREATE OR REPLACE FUNCTION get_scanner_prof_info(
    p_college_code TEXT,
    p_prof_id TEXT
) RETURNS JSON AS $$
DECLARE
    v_college_id UUID;
    v_prof RECORD;
BEGIN
    SELECT id INTO v_college_id FROM public.colleges WHERE trim(upper(college_code)) = trim(upper(p_college_code));
    IF NOT FOUND THEN RETURN json_build_object('valid', false, 'error', 'Invalid College Code'); END IF;

    SELECT * INTO v_prof FROM public.professors WHERE college_id = v_college_id AND trim(lower(prof_id)) = trim(lower(p_prof_id));
    IF NOT FOUND THEN RETURN json_build_object('valid', false, 'error', 'Professor not found'); END IF;

    RETURN json_build_object('valid', true, 'prof_name', v_prof.prof_name, 'subject', v_prof.subject, 'teaching_stage', v_prof.teaching_stage);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
