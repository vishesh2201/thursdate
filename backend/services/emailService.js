const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    this.initialized = false;
    this.initialize();
  }

  initialize() {
    try {
      // Check if SendGrid API key is available
      if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.initialized = true;
        console.log('✅ Email service initialized with SendGrid');
        return;
      }

      // Fallback check for old Gmail config (for backward compatibility)
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('⚠️  Email service not fully configured');
        console.warn('   For production: Set SENDGRID_API_KEY environment variable');
        console.warn('   Get free API key at: https://signup.sendgrid.com/');
        this.initialized = false;
        return;
      }

      console.warn('⚠️  Gmail SMTP detected - this may not work on Render due to port blocking');
      console.warn('   Recommended: Switch to SendGrid (free 100 emails/day)');
      this.initialized = false;
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.initialized = false;
    }
  }

  async sendOTP(email, otp) {
    try {
      if (!this.initialized) {
        console.error('❌ Email service not initialized - check SENDGRID_API_KEY');
        return { success: false, error: 'Email service not configured' };
      }

      console.log(`📧 Sending OTP to ${email}...`);

      const msg = {
        to: email,
        from: {
          email: 'no-reply@sundatetheapp.com',
          name: 'Sundate'
        },
        replyTo: {
          email: 'support@sundatetheapp.com',
          name: 'Sundate Support'
        },
        subject: 'Complete your Sundate account verification',
        // Plain text version (important for spam filters)
        text: `
Hi there,

Welcome to Sundate! We're excited to have you join our community.

To complete your account setup and start connecting with others, please verify your email address using the code below:

Your verification code: ${otp}

This code is valid for the next 10 minutes for security purposes.

Why did I receive this?
You (or someone using your email) started creating a Sundate account. If this wasn't you, you can safely ignore this email - no account has been created yet.

Need help?
If you have any questions or need assistance, our support team is here to help at support@sundatetheapp.com

Best regards,
The Sundate Team

---
Sundate - Meaningful connections, one date at a time
© ${new Date().getFullYear()} Sundate. All rights reserved.

This is an automated message. Please do not reply to this email.
        `.trim(),
        // HTML version (well-structured for better deliverability)
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <meta name="supported-color-schemes" content="light">
            <title>Verify Your Sundate Account</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f8fa; line-height: 1.6;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7f8fa; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <!-- Main Container -->
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
                    
                    <!-- Header with Logo/Brand -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Sundate</h1>
                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Meaningful connections, one date at a time</p>
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 48px 40px 32px;">
                        <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 24px; font-weight: 600;">Welcome to Sundate!</h2>
                        <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">We're excited to have you join our community. To complete your account setup and start connecting with others, please verify your email address.</p>
                        
                        <!-- Verification Code Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0;">
                          <tr>
                            <td align="center" style="background-color: #f9fafb; border: 2px dashed #6366f1; border-radius: 12px; padding: 32px 20px;">
                              <p style="margin: 0 0 12px; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                              <div style="font-size: 36px; font-weight: 700; color: #6366f1; letter-spacing: 6px; font-family: 'Courier New', monospace;">${otp}</div>
                              <p style="margin: 16px 0 0; color: #6b7280; font-size: 13px;">Valid for 10 minutes</p>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Security Info Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                          <tr>
                            <td style="padding: 16px 20px;">
                              <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                                <strong>🔒 Security Tip:</strong> Never share this code with anyone. Sundate staff will never ask for your verification code.
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 32px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">If you didn't request this code, you can safely ignore this email. No account has been created yet.</p>
                      </td>
                    </tr>
                    
                    <!-- Help Section -->
                    <tr>
                      <td style="padding: 0 40px 32px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border-radius: 8px;">
                          <tr>
                            <td style="padding: 24px;">
                              <p style="margin: 0 0 8px; color: #374151; font-size: 15px; font-weight: 600;">Need help?</p>
                              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                                Our support team is here to assist you at 
                                <a href="mailto:support@sundatetheapp.com" style="color: #6366f1; text-decoration: none; font-weight: 500;">support@sundatetheapp.com</a>
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                          This is an automated message from Sundate. Please do not reply to this email.
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          © ${new Date().getFullYear()} Sundate. All rights reserved.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                  
                  <!-- Spacing -->
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px;">
                    <tr>
                      <td style="padding: 24px 0; text-align: center;">
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          You're receiving this because you started creating a Sundate account.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        // Mail settings to improve deliverability
        trackingSettings: {
          clickTracking: { enable: false },
          openTracking: { enable: false }
        },
        mailSettings: {
          bypassListManagement: { enable: false },
          footer: { enable: false },
          sandboxMode: { enable: false }
        },
        // Add custom headers for better deliverability
        headers: {
          'X-Entity-Ref-ID': `otp-${Date.now()}-${email}`,
          'X-Priority': '1',
          'Importance': 'high'
        },
        // Category for SendGrid analytics (helps with reputation)
        categories: ['authentication', 'otp-verification']
      };

      await sgMail.send(msg);
      console.log('✅ OTP email sent successfully to', email);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending email:', error.message);
      if (error.response) {
        console.error('   SendGrid error:', error.response.body);
      }
      return { success: false, error: error.message };
    }
  }

  async verifyConnection() {
    // SendGrid uses API key authentication, no need to verify connection
    return this.initialized;
  }
}

// Export singleton instance
module.exports = new EmailService();
