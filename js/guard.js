/**
 * SYS STD Pro - Authentication Guard
 * Protects all routes from unauthorized or unapproved access.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ensure Supabase Client exists
    if (!window.sbClient) {
        console.error("Auth Guard Error: sbClient is not initialized.");
        return;
    }

    try {
        // 2. Check for active session
        const { data: { session }, error: sessionError } = await sbClient.auth.getSession();
        
        if (sessionError || !session) {
            // No active session -> Kick to auth page
            window.location.replace('auth.html');
            return;
        }

        // 3. Verify College Approval Status
        const userId = session.user.id;
        const { data: company, error: companyError } = await sbClient
            .from('colleges')
            .select('status, college_code')
            .eq('id', userId)
            .single();

        if (companyError && companyError.code !== 'PGRST116') {
            console.error("Auth Guard: Failed to verify company status", companyError);
            return;
        }

        if (!company) {
            // Check if Admin session - allow viewing primary college data
            const ADMIN_EMAILS = ['syscompany85@gmail.com', 'osama@syswms.com', 'osamaazizjaber@gmail.com'];
            if (ADMIN_EMAILS.includes(session.user.email)) {
                console.warn("WMS Guard: Admin account detected. Defaulting to first college record.");
                const { data: firstCol } = await sbClient.from('colleges').select('id, college_code').limit(1).maybeSingle();
                if (firstCol) {
                    window.WMS_COLLEGE_ID = firstCol.id;
                    window.WMS_COLLEGE_CODE = firstCol.college_code;
                    document.dispatchEvent(new CustomEvent('wms-auth-ready'));
                    return;
                }
            }
            return; 
        }

        if (company.status !== 'approved') {
            await sbClient.auth.signOut();
            alert("Security Notice: Your college account is not currently approved for access.");
            window.location.replace('auth.html');
            return;
        }

        // Standard College Session
        window.WMS_COLLEGE_ID = userId;
        window.WMS_COLLEGE_CODE = company.college_code;
        
        // Notify other scripts that auth metadata is ready
        document.dispatchEvent(new CustomEvent('wms-auth-ready'));

    } catch (err) {
        console.error("Auth Guard Error:", err);
        window.location.replace('auth.html');
    }
});
