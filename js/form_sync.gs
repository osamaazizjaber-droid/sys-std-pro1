/**
 * SYS WMS Pro - Google Forms Importer
 * 
 * Instructions:
 * 1. Create a new Google Form with EXACTLY these fields:
 *    - Company Code (Short answer, Required)
 *    - Worker Name (Short answer, Required)
 *    - Position (Short answer)
 *    - Salary (Short answer - numbers only)
 *    - Photo (File upload - choose 'Image' only, max 1 file)
 * 2. In your Google Form, click the three dots (top right) -> "Script editor".
 * 3. Delete any code there, paste this entire file, and click Save (Floppy disk icon).
 * 4. Click "Triggers" (the clock icon on the left menu).
 * 5. Click "Add Trigger" (bottom right).
 * 6. Choose which function to run: `onFormSubmit`
 *    Choose which deployment should run: `Head`
 *    Select event source: `From form`
 *    Select event type: `On form submit`
 * 7. Click "Save", authorize the permissions (it will ask to access Drive and External endpoints).
 * 
 * You're done! Now whenever the form is submitted, the worker and photo instantly sync to your App!
 */

const SUPABASE_URL = 'https://ormjypixacnedlmqrxfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_v76dQER4szVgnbB8yNDhAA_VoNg51Gw';

function onFormSubmit(e) {
  try {
    const responses = e.namedValues;
    const companyCode = responses['Company Code'] ? responses['Company Code'][0].trim() : '';
    const name = responses['Worker Name'] ? responses['Worker Name'][0].trim() : '';
    const position = responses['Position'] ? responses['Position'][0].trim() : '';
    const salaryStr = responses['Salary'] ? responses['Salary'][0].trim() : '0';
    const salary = parseFloat(salaryStr) || 0;
    
    if (!companyCode || !name) return;

    // 1. Get Company ID from DB
    const companyRes = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/companies?company_code=eq.${companyCode}&select=id`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const companyData = JSON.parse(companyRes.getContentText());
    if (!companyData || companyData.length === 0) return; // Company code invalid
    const companyId = companyData[0].id;

    // 2. Upload Photo (if provided)
    let photoUrl = '';
    if (responses['Photo'] && responses['Photo'][0]) {
      const fileUrl = responses['Photo'][0]; 
      
      // Extract Drive File ID from URL
      let fileId = '';
      if (fileUrl.includes('id=')) fileId = fileUrl.split('id=')[1];
      else if (fileUrl.includes('/d/')) fileId = fileUrl.split('/d/')[1].split('/')[0];
      
      if (fileId) {
        const file = DriveApp.getFileById(fileId);
        
        // Ensure file is publicly readable so Supabase doesn't fail downloading
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        const blob = file.getBlob();
        const ext = file.getName().split('.').pop() || 'jpg';
        const filename = `worker_${new Date().getTime()}.${ext}`;
        
        try {
          const uploadUrl = `${SUPABASE_URL}/storage/v1/object/photos/${companyId}/${filename}`;
          UrlFetchApp.fetch(uploadUrl, {
            method: 'post',
            headers: { 
              'apikey': SUPABASE_ANON_KEY, 
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 
              'Content-Type': blob.getContentType() || 'image/jpeg' 
            },
            payload: blob.getBytes()
          });
          
          photoUrl = `${SUPABASE_URL}/storage/v1/object/public/photos/${companyId}/${filename}`;
        } catch (uploadErr) {
          console.error("Supabase Upload Error: " + uploadErr);
        }
      }
    }

    // 3. Insert Worker to Database
    const payload = {
      company_id: companyId,
      name: name,
      position: position,
      salary: salary,
      photo_url: photoUrl
    };
    
    UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/workers`, {
      method: 'post',
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 
        'Content-Type': 'application/json', 
        'Prefer': 'return=minimal' 
      },
      payload: JSON.stringify(payload)
    });

  } catch(err) {
    console.error("Fatal Error: " + err.toString());
  }
}
