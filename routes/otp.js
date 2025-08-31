import express from "express";
import { OTP } from "../models/index.js";
import {
  generateOTP,
  sendOTPEmail,
  verifyOTP,
  cleanupExpiredOTPs,
} from "../utils/emailService.js";

const router = express.Router();

// Send OTP for registration
router.post("/send", async (req, res) => {
  try {
    const { email, type = "REGISTRATION" } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Clean up expired OTPs
    await cleanupExpiredOTPs(OTP);

    // Check if there's already an active OTP for this email
    const existingOTP = await OTP.findOne({
      email,
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (existingOTP) {
      const timeDiff = existingOTP.expiresAt - new Date();
      const minutesLeft = Math.ceil(timeDiff / (1000 * 60));

      if (minutesLeft > 5) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${minutesLeft} minutes before requesting another OTP`,
        });
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    const otpRecord = new OTP({
      email,
      otp,
      type,
      expiresAt,
    });

    await otpRecord.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, type);

    if (!emailResult.success) {
      // Delete the OTP record if email failed
      await OTP.findByIdAndDelete(otpRecord._id);

      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
        error: emailResult.error,
      });
    }

    res.json({
      success: true,
      message: "OTP sent successfully",
      data: {
        email,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
});

// Verify OTP
router.post("/verify", async (req, res) => {
  try {
    const { email, otp, type = "REGISTRATION" } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Clean up expired OTPs
    await cleanupExpiredOTPs(OTP);

    // Verify OTP
    const verificationResult = await verifyOTP(OTP, email, otp, type);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message,
      });
    }

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
});

// Resend OTP
router.post("/resend", async (req, res) => {
  try {
    const { email, type = "REGISTRATION" } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Delete any existing unused OTPs for this email and type
    await OTP.deleteMany({
      email,
      type,
      isUsed: false,
    });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    const otpRecord = new OTP({
      email,
      otp,
      type,
      expiresAt,
    });

    await otpRecord.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, type);

    if (!emailResult.success) {
      // Delete the OTP record if email failed
      await OTP.findByIdAndDelete(otpRecord._id);

      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
        error: emailResult.error,
      });
    }

    res.json({
      success: true,
      message: "OTP resent successfully",
      data: {
        email,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
      error: error.message,
    });
  }
});

export default router;

