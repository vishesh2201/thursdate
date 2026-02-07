const axios = require('axios');

class SMSService {
  constructor() {
    this.apiKey = process.env.TWOFACTOR_API_KEY;
    this.baseUrl = 'https://2factor.in/API/V1';
    this.templateName = process.env.TWOFACTOR_TEMPLATE || 'OTP1';
  }

  /**
   * Send OTP via 2factor.in
   * @param {string} mobileNumber - 10 digit mobile number without country code
   * @returns {Promise<{success: boolean, sessionId?: string, error?: string}>}
   */
  async sendOTP(mobileNumber) {
    try {
      if (!this.apiKey) {
        throw new Error('2Factor API key not configured');
      }

      // Ensure mobile number is 10 digits
      const cleanNumber = mobileNumber.replace(/\D/g, '');
      if (cleanNumber.length !== 10) {
        throw new Error('Mobile number must be 10 digits');
      }

      // 2factor.in API endpoint
      const url = `${this.baseUrl}/${this.apiKey}/SMS/${cleanNumber}/AUTOGEN/${this.templateName}`;
      
      console.log(`Sending OTP to ${cleanNumber} via 2factor.in`);
      
      const response = await axios.get(url, {
        timeout: 10000 // 10 second timeout
      });

      if (response.data && response.data.Status === 'Success') {
        console.log(`OTP sent successfully. Session ID: ${response.data.Details}`);
        return {
          success: true,
          sessionId: response.data.Details,
          message: 'OTP sent successfully'
        };
      } else {
        console.error('2factor.in error:', response.data);
        return {
          success: false,
          error: response.data.Details || 'Failed to send OTP'
        };
      }

    } catch (error) {
      console.error('SMS Service Error:', error.message);
      
      if (error.response) {
        // API responded with error
        return {
          success: false,
          error: error.response.data?.Details || 'Failed to send OTP'
        };
      } else if (error.request) {
        // Request made but no response
        return {
          success: false,
          error: 'Network error. Please try again.'
        };
      } else {
        // Other errors
        return {
          success: false,
          error: error.message || 'Failed to send OTP'
        };
      }
    }
  }

  /**
   * Verify OTP via 2factor.in
   * @param {string} sessionId - Session ID returned from sendOTP
   * @param {string} otp - 6 digit OTP entered by user
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async verifyOTP(sessionId, otp) {
    try {
      if (!this.apiKey) {
        throw new Error('2Factor API key not configured');
      }

      if (!sessionId) {
        return {
          success: false,
          error: 'Invalid session. Please request a new OTP.'
        };
      }

      // Ensure OTP is 6 digits
      const cleanOTP = otp.replace(/\D/g, '');
      if (cleanOTP.length !== 6) {
        return {
          success: false,
          error: 'OTP must be 6 digits'
        };
      }

      // 2factor.in verify endpoint
      const url = `${this.baseUrl}/${this.apiKey}/SMS/VERIFY/${sessionId}/${cleanOTP}`;
      
      console.log(`Verifying OTP for session: ${sessionId}`);
      
      const response = await axios.get(url, {
        timeout: 10000 // 10 second timeout
      });

      if (response.data && response.data.Status === 'Success') {
        console.log('OTP verified successfully');
        return {
          success: true,
          message: 'OTP verified successfully'
        };
      } else {
        console.error('2factor.in verification error:', response.data);
        return {
          success: false,
          error: response.data.Details || 'Invalid OTP'
        };
      }

    } catch (error) {
      console.error('SMS Verification Error:', error.message);
      
      if (error.response) {
        // API responded with error
        return {
          success: false,
          error: error.response.data?.Details || 'Invalid or expired OTP'
        };
      } else if (error.request) {
        // Request made but no response
        return {
          success: false,
          error: 'Network error. Please try again.'
        };
      } else {
        // Other errors
        return {
          success: false,
          error: error.message || 'Failed to verify OTP'
        };
      }
    }
  }
}

module.exports = new SMSService();
