/**
 * SYS WMS Pro - Authentication Guard
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

        // 3. Verify Company Approval Status
        // Even if they have a session token, they might have been rejected later.
        const userId = session.user.id;
        const { data: company, error: companyError } = await sbClient
            .from('companies')
            .select('status, company_code')
            .eq('id', userId)
            .single();

        if (companyError && companyError.code !== 'PGRST116') {
            console.error("Auth Guard: Failed to verify company status", companyError);
            return;
        }

        if (!company) {
            // Assume admin or legacy account without a company profile
            return; 
        }

        if (company.status !== 'approved') {
            // Company is pending or rejected. Revoke access immediately.
            await sbClient.auth.signOut();
            alert("Security Notice: Your company account is not currently approved for access. Please contact administration.");
            window.location.replace('auth.html');
            return;
        }

        // 4. Attach Company Metadata to Window object for easy access across the app
        window.WMS_COMPANY_CODE = company.company_code;
        window.WMS_COMPANY_ID = session.user.id;

    } catch (err) {
        console.error("Auth Guard encounter a critical error:", err);
        window.location.replace('auth.html');
    }
});
