-- scanner_rpc.sql
-- INSTRUCTIONS: Run this script precisely once in your Supabase SQL Editor to enable secure mobile scanning.

-- RPC 1: Safely retrieve the worker name for the viewfinder confirmation UI
CREATE OR REPLACE FUNCTION get_scanner_worker_info(
    p_company_code TEXT,
    p_worker_barcode TEXT
) RETURNS TEXT AS $$
DECLARE
    v_company_id UUID;
    v_worker_name TEXT;
    v_parsed_id INT;
BEGIN
    -- Force uppercase and trim spaces to prevent mobile keyboard input mismatches or database trailing spaces
    SELECT id INTO v_company_id FROM public.companies WHERE trim(upper(company_code)) = trim(upper(p_company_code));
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid Company Code';
    END IF;

    v_parsed_id := regexp_replace(p_worker_barcode, '\D', '', 'g')::INT;

    SELECT name INTO v_worker_name FROM public.workers WHERE company_id = v_company_id AND id = v_parsed_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Worker not found';
    END IF;

    RETURN v_worker_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC 2: Log the attendance securely from the mobile scanner
CREATE OR REPLACE FUNCTION log_scanner_attendance(
    p_company_code TEXT,
    p_action_mode TEXT, -- Must be exactly 'in' or 'out'
    p_worker_barcode TEXT, -- e.g. "W-053" or just "53"
    p_overtime NUMERIC
) RETURNS JSON AS $$
DECLARE
    v_company_id UUID;
    v_worker RECORD;
    v_scan_date DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Baghdad')::DATE;
    v_scan_time TEXT := to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Baghdad', 'HH12:MI AM');
    v_attendance RECORD;
    v_parsed_id INT;
BEGIN
    -- 1. Ensure the user's mobile device is authorized with a valid Company Code
    -- We forcefully uppercase and trim to eliminate hidden formatting anomalies from the user's phone or db.
    SELECT id INTO v_company_id FROM public.companies WHERE trim(upper(company_code)) = trim(upper(p_company_code));
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid Company Code. Please re-login on the scanner.';
    END IF;

    -- 2. Clean up the barcode to extract the integer Worker ID safely
    v_parsed_id := regexp_replace(p_worker_barcode, '\D', '', 'g')::INT;

    -- 3. Locate the worker, guaranteeing they strictly belong to the identified company
    SELECT * INTO v_worker FROM public.workers WHERE company_id = v_company_id AND id = v_parsed_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Worker not found matching this ID for your company.';
    END IF;

    -- 4. Check the worker's attendance record for today
    SELECT * INTO v_attendance FROM public.attendance 
    WHERE company_id = v_company_id AND worker_id = v_worker.id AND date = v_scan_date LIMIT 1;

    -- 5. Process Check-In Logic
    IF p_action_mode = 'in' THEN
        IF FOUND THEN
            RAISE EXCEPTION '% is already checked in today.', v_worker.name;
        ELSE
            -- Log Check-In
            INSERT INTO public.attendance (company_id, worker_id, worker_name, date, status, check_in, overtime, notes)
            VALUES (v_company_id, v_worker.id, v_worker.name, v_scan_date, 'Active Shift', v_scan_time, 0, 'Mobile Scanner');
            
            RETURN json_build_object('status', 'success', 'worker_name', v_worker.name, 'action', 'Checked In', 'time', v_scan_time);
        END IF;

    -- 6. Process Check-Out Logic
    ELSIF p_action_mode = 'out' THEN
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Cannot check out: % has no active shift today.', v_worker.name;
        ELSIF v_attendance.check_out IS NOT NULL THEN
            RAISE EXCEPTION '% has already checked out today.', v_worker.name;
        ELSE
            -- Log Check-Out alongside the entered Overtime Hours
            UPDATE public.attendance 
            SET status = 'Completed', check_out = v_scan_time, overtime = p_overtime
            WHERE id = v_attendance.id;
            
            RETURN json_build_object('status', 'success', 'worker_name', v_worker.name, 'action', 'Checked Out', 'time', v_scan_time, 'overtime', p_overtime);
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid action mode provided.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC 3: Pre-Authenticate the Scanner Device
CREATE OR REPLACE FUNCTION verify_scanner_code(
    p_company_code TEXT
) RETURNS JSON AS $$
DECLARE
    v_company RECORD;
BEGIN
    -- Bypass RLS to verify if the code exists
    SELECT id, company_name INTO v_company FROM public.companies WHERE trim(upper(company_code)) = trim(upper(p_company_code));
    
    IF NOT FOUND THEN
        RETURN json_build_object('valid', false);
    END IF;
    
    RETURN json_build_object('valid', true, 'company_name', v_company.company_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
