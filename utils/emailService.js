import nodemailer from "nodemailer";

// Generate a fixed 6-digit OTP for development
export const generateOTP = () => {
  return "661233"; // Fixed OTP for development
};

// Send OTP email (Development mode - no actual sending)
export const sendOTPEmail = async (email, otp, type = "REGISTRATION") => {
  try {
    // Skip actual email sending for development - just log the OTP
    console.log(`📧 [DEV MODE] OTP Email would be sent to: ${email}`);
    console.log(`🔢 [DEV MODE] OTP Code: ${otp}`);
    console.log(`📝 [DEV MODE] Email Type: ${type}`);

    // Simulate successful email sending
    return {
      success: true,
      messageId: "dev-mode-" + Date.now(),
    };
  } catch (error) {
    console.error("Error in dev mode email:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Verify OTP
export const verifyOTP = async (OTP, email, otp, type = "REGISTRATION") => {
  try {
    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email,
      otp,
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return {
        success: false,
        message: "Invalid or expired OTP",
      };
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return {
        success: false,
        message: "Maximum OTP attempts exceeded",
      };
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    return {
      success: true,
      message: "OTP verified successfully",
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Clean up expired OTPs
export const cleanupExpiredOTPs = async (OTP) => {
  try {
    const result = await OTP.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
    return result.deletedCount;
  } catch (error) {
    console.error("Error cleaning up expired OTPs:", error);
    return 0;
  }
};
