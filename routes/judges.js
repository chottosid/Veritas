import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Judge, FIR } from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Judge Registration
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      address,
      dateOfBirth,
      phone,
      email,
      courtName,
      rank,
      jid,
      password,
    } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if judge already exists
    const existingJudge = await Judge.findOne({
      $or: [{ jid }, { phone: phone || null }, { email: email || null }],
    });

    if (existingJudge) {
      return res.status(400).json({
        success: false,
        message: "Judge already exists with this JID, phone, or email",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new judge
    const judge = new Judge({
      name,
      address,
      dateOfBirth,
      phone,
      email,
      courtName,
      rank,
      jid,
      password: hashedPassword,
    });

    await judge.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: judge._id,
        role: "judge",
        jid: judge.jid,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.status(201).json({
      success: true,
      message: "Judge registered successfully",
      data: {
        id: judge._id,
        name: judge.name,
        jid: judge.jid,
        courtName: judge.courtName,
        rank: judge.rank,
        token,
      },
    });
  } catch (error) {
    console.error("Judge registration error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register judge",
      error: error.message,
    });
  }
});

// Judge Login
router.post("/login", async (req, res) => {
  try {
    const { jid, password } = req.body;

    if (!jid || !password) {
      return res.status(400).json({
        success: false,
        message: "JID and password are required",
      });
    }

    // Find judge by JID
    const judge = await Judge.findOne({ jid });

    if (!judge) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, judge.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: judge._id,
        role: "judge",
        jid: judge.jid,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: judge._id,
        name: judge.name,
        jid: judge.jid,
        courtName: judge.courtName,
        rank: judge.rank,
        token,
      },
    });
  } catch (error) {
    console.error("Judge login error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to login",
      error: error.message,
    });
  }
});

// Get my profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const judgeId = req.user.id;

    const judge = await Judge.findById(judgeId).select("-password");
    if (!judge) {
      return res.status(404).json({
        success: false,
        message: "Judge not found",
      });
    }

    res.json({
      success: true,
      data: judge,
    });
  } catch (error) {
    console.error("Get judge profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: error.message,
    });
  }
});

// Get FIRs submitted to me
router.get("/firs", authenticateToken, async (req, res) => {
  try {
    const judgeId = req.user.id;

    const firs = await FIR.find({ submittedToJudge: judgeId })
      .populate("complaintId", "title description location complainantId")
      .populate("registeredBy", "name pid rank station")
      .populate({
        path: "complaintId",
        populate: {
          path: "complainantId",
          select: "name nid phone",
        },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: firs,
    });
  } catch (error) {
    console.error("Get judge FIRs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get FIRs",
      error: error.message,
    });
  }
});

export default router;
