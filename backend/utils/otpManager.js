// In-memory OTP storage (for production, consider Redis or database)
class OTPManager {
  constructor() {
    this.otps = new Map(); // email -> { otp, expiresAt, attempts, sentAt }
    this.rateLimits = new Map(); // email -> { count, resetAt }
    
    // Cleanup expired OTPs every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Check rate limiting (max 3 OTP requests per 5 minutes)
  checkRateLimit(email) {
    const now = Date.now();
    const limit = this.rateLimits.get(email);

    if (!limit) {
      this.rateLimits.set(email, { count: 1, resetAt: now + 5 * 60 * 1000 });
      return { allowed: true, remaining: 2 };
    }

    if (now > limit.resetAt) {
      // Reset the limit
      this.rateLimits.set(email, { count: 1, resetAt: now + 5 * 60 * 1000 });
      return { allowed: true, remaining: 2 };
    }

    if (limit.count >= 3) {
      const waitTime = Math.ceil((limit.resetAt - now) / 1000);
      return { allowed: false, remaining: 0, waitTime };
    }

    limit.count++;
    return { allowed: true, remaining: 3 - limit.count };
  }

  // Store OTP
  storeOTP(email, otp) {
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    this.otps.set(email, {
      otp,
      expiresAt,
      attempts: 0,
      sentAt: Date.now()
    });
    console.log(`OTP stored for ${email}, expires at ${new Date(expiresAt).toISOString()}`);
  }

  // Verify OTP
  verifyOTP(email, otp) {
    const stored = this.otps.get(email);

    console.log('🔍 OTP Verification Debug:');
    console.log('   Email:', email);
    console.log('   Input OTP:', otp, 'Type:', typeof otp, 'Length:', otp?.length);
    console.log('   Stored OTP:', stored?.otp, 'Type:', typeof stored?.otp, 'Length:', stored?.otp?.length);
    console.log('   Comparison:', stored?.otp === otp);

    if (!stored) {
      console.log('   ❌ No OTP found in storage');
      return { valid: false, error: 'No OTP found. Please request a new one.' };
    }

    if (Date.now() > stored.expiresAt) {
      console.log('   ❌ OTP expired');
      this.otps.delete(email);
      return { valid: false, error: 'OTP has expired. Please request a new one.' };
    }

    stored.attempts++;

    if (stored.attempts > 3) {
      console.log('   ❌ Too many attempts');
      this.otps.delete(email);
      return { valid: false, error: 'Too many failed attempts. Please request a new OTP.' };
    }

    // Normalize both values to strings and trim whitespace
    const storedOTP = String(stored.otp).trim();
    const inputOTP = String(otp).trim();

    if (storedOTP !== inputOTP) {
      console.log('   ❌ OTP mismatch:', { stored: storedOTP, input: inputOTP });
      return { 
        valid: false, 
        error: `Invalid OTP. ${4 - stored.attempts} attempts remaining.`,
        attemptsRemaining: 3 - stored.attempts
      };
    }

    console.log('   ✅ OTP valid!');

    // OTP is valid
    this.otps.delete(email);
    this.rateLimits.delete(email); // Clear rate limit on successful verification
    return { valid: true };
  }

  // Resend OTP (generate new one)
  canResend(email) {
    const stored = this.otps.get(email);
    if (!stored) {
      return { allowed: true };
    }

    // Must wait at least 30 seconds before resending
    const timeSinceLastSend = Date.now() - stored.sentAt;
    const minWaitTime = 30 * 1000; // 30 seconds

    if (timeSinceLastSend < minWaitTime) {
      const waitTime = Math.ceil((minWaitTime - timeSinceLastSend) / 1000);
      return { allowed: false, waitTime };
    }

    return { allowed: true };
  }

  // Clear OTP for email
  clearOTP(email) {
    this.otps.delete(email);
  }

  // Cleanup expired OTPs
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [email, data] of this.otps.entries()) {
      if (now > data.expiresAt) {
        this.otps.delete(email);
        cleaned++;
      }
    }

    // Cleanup expired rate limits
    for (const [email, limit] of this.rateLimits.entries()) {
      if (now > limit.resetAt) {
        this.rateLimits.delete(email);
      }
    }

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired OTPs`);
    }
  }

  // Get stats (for debugging)
  getStats() {
    return {
      activeOTPs: this.otps.size,
      rateLimitedEmails: this.rateLimits.size
    };
  }
}

// Export singleton instance
module.exports = new OTPManager();
