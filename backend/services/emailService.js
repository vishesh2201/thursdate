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
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@thursdate.app',
          name: 'Thursdate'
        },
        subject: 'Your Thursdate Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .otp-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
              .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Thursdate Email Verification</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>Thank you for signing up with Thursdate! Please use the following verification code to complete your email verification:</p>
                
                <div class="otp-box">
                  <div class="otp-code">${otp}</div>
                </div>
                
                <p><strong>This code will expire in 10 minutes.</strong></p>
                <p>If you didn't request this code, please ignore this email.</p>
                
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Thursdate. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
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
