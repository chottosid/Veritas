import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Generate a random 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create email transporter for Gmail
const createTransport = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true" || false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
    tls: {
      rejectUnauthorized: false,
    },
    // Gmail-specific settings
    pool: true,
    maxConnections: 1,
    maxMessages: 3,
    rateDelta: 20000,
    rateLimit: 5,
  });
};

// Send OTP email using Gmail
export const sendOTPEmail = async (email, otp, type = "REGISTRATION") => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env file");
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    const transporter = createTransport();

    // Email templates based on type
    const emailTemplates = {
      REGISTRATION: {
        subject: "Veritas - Email Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">Veritas</h1>
              <p style="color: #6b7280; margin: 5px 0;">Blockchain-based Justice System</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-top: 0;">Email Verification Required</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Thank you for registering with Veritas. To complete your registration, please verify your email address using the code below:
              </p>
              
              <div style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #1f2937; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; color: #9ca3af; font-size: 12px;">
              <p>© 2025 Veritas. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        `,
        text: `
          Veritas - Email Verification Code
          
          Thank you for registering with Veritas. To complete your registration, please verify your email address using the code below:
          
          Verification Code: ${otp}
          
          This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
          
          © 2025 Veritas. All rights reserved.
        `
      },
      LOGIN: {
        subject: "Veritas - Login Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">Veritas</h1>
              <p style="color: #6b7280; margin: 5px 0;">Blockchain-based Justice System</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-top: 0;">Login Verification</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Someone is trying to log into your Veritas account. Use the code below to complete the login:
              </p>
              
              <div style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #1f2937; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                This code will expire in 10 minutes. If you didn't request this login, please secure your account immediately.
              </p>
            </div>
            
            <div style="text-align: center; color: #9ca3af; font-size: 12px;">
              <p>© 2025 Veritas. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        `,
        text: `
          Veritas - Login Verification Code
          
          Someone is trying to log into your Veritas account. Use the code below to complete the login:
          
          Verification Code: ${otp}
          
          This code will expire in 10 minutes. If you didn't request this login, please secure your account immediately.
          
          © 2025 Veritas. All rights reserved.
        `
      },
      PASSWORD_RESET: {
        subject: "Veritas - Password Reset Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">Veritas</h1>
              <p style="color: #6b7280; margin: 5px 0;">Blockchain-based Justice System</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                You requested to reset your password for your Veritas account. Use the code below to proceed:
              </p>
              
              <div style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #1f2937; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                This code will expire in 10 minutes. If you didn't request this password reset, please ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; color: #9ca3af; font-size: 12px;">
              <p>© 2025 Veritas. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        `,
        text: `
          Veritas - Password Reset Code
          
          You requested to reset your password for your Veritas account. Use the code below to proceed:
          
          Verification Code: ${otp}
          
          This code will expire in 10 minutes. If you didn't request this password reset, please ignore this email.
          
          © 2025 Veritas. All rights reserved.
        `
      }
    };

    const template = emailTemplates[type] || emailTemplates.REGISTRATION;

    const mailOptions = {
      from: `"Veritas" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`📧 OTP Email sent successfully to: ${email}`);
    console.log(`🔢 OTP Code: ${otp}`);
    console.log(`📝 Email Type: ${type}`);
    console.log(`📨 Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    
    // Gmail-specific error handling
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = "Gmail authentication failed. Please check your app password and ensure 2-Factor Authentication is enabled.";
    } else if (error.code === 'ECONNECTION') {
      errorMessage = "Failed to connect to Gmail servers. Please check your internet connection.";
    } else if (error.responseCode === 535) {
      errorMessage = "Gmail authentication failed. Please verify your app password is correct.";
    } else if (error.responseCode === 550) {
      errorMessage = "Gmail rejected the email. Please check the recipient email address.";
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Verify OTP
export const verifyOTP = async (OTP, email, otp, type = "REGISTRATION") => {
  try {
    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email,
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return {
        success: false,
        message: "No valid OTP found for this email. Please request a new OTP.",
      };
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return {
        success: false,
        message: "Maximum OTP attempts exceeded. Please request a new OTP.",
      };
    }

    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();

      const remainingAttempts = otpRecord.maxAttempts - otpRecord.attempts;
      
      return {
        success: false,
        message: `Invalid OTP. ${remainingAttempts > 0 ? `You have ${remainingAttempts} attempts remaining.` : 'Maximum attempts exceeded.'}`,
      };
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    console.log(`✅ OTP verified successfully for: ${email}`);
    return {
      success: true,
      message: "OTP verified successfully",
    };
  } catch (error) {
    console.error("❌ Error verifying OTP:", error);
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
