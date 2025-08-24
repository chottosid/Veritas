import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Lawyer } from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Lawyer Registration
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      address,
      dateOfBirth,
      phone,
      email,
      firmName,
      bid,
      password,
    } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if lawyer already exists
    const existingLawyer = await Lawyer.findOne({
      $or: [{ bid }, { phone: phone || null }, { email: email || null }],
    });

    if (existingLawyer) {
      return res.status(400).json({
        success: false,
        message: "Lawyer already exists with this BID, phone, or email",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new lawyer
    const lawyer = new Lawyer({
      name,
      address,
      dateOfBirth,
      phone,
      email,
      firmName,
      bid,
      password: hashedPassword,
    });

    await lawyer.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: lawyer._id,
        role: "lawyer",
        bid: lawyer.bid,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.status(201).json({
      success: true,
      message: "Lawyer registered successfully",
      data: {
        id: lawyer._id,
        name: lawyer.name,
        bid: lawyer.bid,
        firmName: lawyer.firmName,
        token,
      },
    });
  } catch (error) {
    console.error("Lawyer registration error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register lawyer",
      error: error.message,
    });
  }
});

// Lawyer Login
router.post("/login", async (req, res) => {
  try {
    const { bid, password } = req.body;

    if (!bid || !password) {
      return res.status(400).json({
        success: false,
        message: "BID and password are required",
      });
    }

    // Find lawyer by BID
    const lawyer = await Lawyer.findOne({ bid });

    if (!lawyer) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, lawyer.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: lawyer._id,
        role: "lawyer",
        bid: lawyer.bid,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: lawyer._id,
        name: lawyer.name,
        bid: lawyer.bid,
        firmName: lawyer.firmName,
        token,
      },
    });
  } catch (error) {
    console.error("Lawyer login error:", error);
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
    const lawyerId = req.user.id;

    const lawyer = await Lawyer.findById(lawyerId).select("-password");
    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer not found",
      });
    }

    res.json({
      success: true,
      data: lawyer,
    });
  } catch (error) {
    console.error("Get lawyer profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: error.message,
    });
  }
});

export default router;
