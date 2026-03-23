/**
 * SYS WMS Pro - Official Google Apps Script Webhook
 * 
 * Instructions:
 * 1. Go to https://script.google.com/ and create a "New Project".
 * 2. Delete all existing code and paste this entire file.
 * 3. Click "Deploy" -> "New Deployment" in the top right.
 * 4. Select type "Web App".
 * 5. Execute as: "Me" (your email).
 * 6. Who has access: "Anyone".
 * 7. Click Deploy, Authorize access, and copy the Web App URL.
 * 8. Paste the Web App URL into your `admin.js` file (GOOGLE_APPS_SCRIPT_WEBHOOK).
 */

function doPost(e) {
  try {
    // 1. Parse incoming Data from admin.js
    const action = e.parameter.action;
    const email = e.parameter.email;
    const status = e.parameter.status;
    const companyName = e.parameter.company_name;

    if (action !== 'company_status_change') {
      return response("Ignored action");
    }

    if (!email) {
      return response("Missing email address");
    }

    // 2. Prepare Email Content
    const systemName = "SYS WMS Pro";
    let subject = "";
    let bodyText = "";
    let bodyHtml = "";

    if (status === 'approved') {
      subject = `✅ Your Account is Approved - ${systemName}`;
      
      bodyText = `Hello ${companyName},\n\nYour registration for SYS WMS Pro has been approved! You can now log into your dashboard to start managing your industrial workforce.\n\nThank you,\nThe Admin Team`;
      
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e3e4; border-radius: 10px;">
          <h2 style="color: #10b981; margin-bottom: 20px;">Welcome to ${systemName}</h2>
          <p style="font-size: 16px; color: #333;">Hello <strong>${companyName}</strong>,</p>
          <p style="font-size: 16px; color: #555; line-height: 1.5;">Your company registration has been officially approved by the administrator. You now have full access to your intelligent dashboard.</p>
          
          <a href="#" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #f49000; color: white; text-decoration: none; font-weight: bold; border-radius: 6px;">Login to Dashboard</a>
          
          <p style="margin-top: 30px; font-size: 13px; color: #888;">Thank you,<br>The Administration Team</p>
        </div>
      `;
    } 
    else if (status === 'rejected') {
      subject = `🚫 Account Registration Update - ${systemName}`;
      
      bodyText = `Hello ${companyName},\n\nWe regret to inform you that your registration for SYS WMS Pro was not approved. If you believe this is an error, please respond to this email.\n\nThank you,\nThe Admin Team`;
      
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e3e4; border-radius: 10px;">
          <h2 style="color: #e11d48; margin-bottom: 20px;">Registration Unsuccessful</h2>
          <p style="font-size: 16px; color: #333;">Hello <strong>${companyName}</strong>,</p>
          <p style="font-size: 16px; color: #555; line-height: 1.5;">Your recent request to register on ${systemName} was reviewed, but unfortunately it was not approved at this time.</p>
          <p style="margin-top: 30px; font-size: 13px; color: #888;">Thank you,<br>The Administration Team</p>
        </div>
      `;
    }

    // 3. Send Email using your connected Google Workspace/Gmail Account
    if (subject && bodyHtml) {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        htmlBody: bodyHtml
      });
    }

    return response("Email dispatch successful");

  } catch (err) {
    return response("Error: " + err.toString());
  }
}

// Ignore GET requests (usually happens if someone pastes the webhook URL in their browser)
function doGet(e) {
  return response("SYS WMS Pro Webhook is Active. Awaiting POST requests.");
}

// Utility to return JSON to the caller
function response(msg) {
  return ContentService.createTextOutput(JSON.stringify({ message: msg })).setMimeType(ContentService.MimeType.JSON);
}
