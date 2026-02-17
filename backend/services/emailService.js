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
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@sundatetheapp.com',
          name: 'Sundate'
        },
        replyTo: process.env.SENDGRID_FROM_EMAIL || 'sundatetheapp@gmail.com',
        subject: 'Your Sundate Verification Code',
        // Plain text version (important for spam filters)
        text: `
Hello,

Thank you for signing up with Sundate! 

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
Sundate Team

© ${new Date().getFullYear()} Sundate. All rights reserved.
        `.trim(),
        // HTML version (simpler design, less likely to trigger spam filters)
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sundate Verification Code</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background-color: #6366f1; padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Sundate</h1>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">Hello,</p>
                        <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.5;">Thank you for signing up with Sundate! Please use the following verification code to complete your email verification:</p>
                        
                        <!-- OTP Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center" style="background-color: #f8f9fa; border: 2px solid #6366f1; border-radius: 8px; padding: 30px;">
                              <span style="font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 8px;">${otp}</span>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0 0; color: #333333; font-size: 16px; line-height: 1.5;"><strong>This code will expire in 10 minutes.</strong></p>
                        <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">If you didn't request this code, please ignore this email.</p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #666666; font-size: 12px;">© ${new Date().getFullYear()} Sundate. All rights reserved.</p>
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
        }
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
