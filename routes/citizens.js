import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import { Citizen, Complaint, Police, Case, FIR } from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { uploadToIPFS } from "../utils/ipfs.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Citizen Registration
router.post("/register", async (req, res) => {
  try {
    const { name, address, dateOfBirth, phone, email, nid, password } =
      req.body;

    // Check if citizen already exists
    const existingCitizen = await Citizen.findOne({
      $or: [{ nid }, { phone: phone || null }, { email: email || null }],
    });

    if (existingCitizen) {
      return res.status(400).json({
        success: false,
        message: "Citizen already exists with this NID, phone, or email",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new citizen
    const citizen = new Citizen({
      name,
      address,
      dateOfBirth,
      phone,
      email,
      nid,
      password: hashedPassword,
    });

    await citizen.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: citizen._id,
        role: "citizen",
        nid: citizen.nid,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.status(201).json({
      success: true,
      message: "Citizen registered successfully",
      data: {
        id: citizen._id,
        name: citizen.name,
        nid: citizen.nid,
        token,
      },
    });
  } catch (error) {
    console.error("Citizen registration error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register citizen",
      error: error.message,
    });
  }
});

// Citizen Login
router.post("/login", async (req, res) => {
  try {
    const { nid, phone, password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (!nid && !phone) {
      return res.status(400).json({
        success: false,
        message: "NID or phone number is required",
      });
    }

    // Find citizen by NID or phone
    const citizen = await Citizen.findOne({
      $or: [{ nid: nid || null }, { phone: phone || null }],
    });

    if (!citizen) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, citizen.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: citizen._id,
        role: "citizen",
        nid: citizen.nid,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: citizen._id,
        name: citizen.name,
        nid: citizen.nid,
        token,
      },
    });
  } catch (error) {
    console.error("Citizen login error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to login",
      error: error.message,
    });
  }
});

// Get citizen profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const citizenId = req.user.id;

    const citizen = await Citizen.findById(citizenId);
    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: "Citizen not found",
      });
    }

    res.json({
      success: true,
      data: citizen,
    });
  } catch (error) {
    console.error("Get citizen error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get citizen details",
      error: error.message,
    });
  }
});

// =============== COMPLAINT ROUTES ===============

// Get all complaints by citizen (from JWT)
router.get("/complaints", authenticateToken, async (req, res) => {
  try {
    const citizenId = req.user.id;

    const complaints = await Complaint.find({ complainantId: citizenId })
      .populate("assignedOfficerIds", "name rank station")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    console.error("Get complaints error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get complaints",
      error: error.message,
    });
  }
});

// Get cases involving a citizen (from JWT)
router.get("/cases", authenticateToken, async (req, res) => {
  try {
    const citizenId = req.user.id;

    // Find complaints by the citizen
    const complaints = await Complaint.find({ complainantId: citizenId });
    const complaintIds = complaints.map((c) => c._id);

    // Find FIRs related to these complaints
    const firs = await FIR.find({ complaintId: { $in: complaintIds } });
    const firIds = firs.map((f) => f._id);

    // Find cases related to these FIRs
    const cases = await Case.find({ firId: { $in: firIds } })
      .populate("firId")
      .populate("assignedJudgeId", "name courtName")
      .populate("accusedLawyerId", "name firmName")
      .populate("prosecutorLawyerId", "name firmName")
      .populate("investigatingOfficerIds", "name rank station")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: cases,
    });
  } catch (error) {
    console.error("Get cases error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cases",
      error: error.message,
    });
  }
});

// File new complaint with attachments (from JWT)
router.post(
  "/complaints",
  authenticateToken,
  upload.array("attachments", 5),
  async (req, res) => {
    try {
      const complainantId = req.user.id; // Get from JWT token
      const { title, description, location, area } = req.body;

      // Verify citizen exists
      const citizen = await Citizen.findById(complainantId);
      if (!citizen) {
        return res.status(404).json({
          success: false,
          message: "Citizen not found",
        });
      }

      // Process attachments if any
      const attachments = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const uploadResult = await uploadToIPFS(
            file.buffer,
            file.originalname
          );
          if (uploadResult.success) {
            attachments.push({
              fileName: file.originalname,
              ipfsHash: uploadResult.ipfsHash,
              fileSize: file.size,
            });
          } else {
            console.error("Failed to upload file to IPFS:", uploadResult.error);
            // Continue with other files, don't fail the entire complaint
          }
        }
      }

      // Create complaint
      const complaint = new Complaint({
        complainantId,
        title,
        description,
        location,
        area,
        attachments,
        status: "PENDING",
      });

      await complaint.save();

      // Populate the response
      await complaint.populate("complainantId", "name nid");

      res.status(201).json({
        success: true,
        message: "Complaint filed successfully",
        data: complaint,
      });
    } catch (error) {
      console.error("File complaint error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to file complaint",
        error: error.message,
      });
    }
  }
);

// Get complaint details
router.get("/complaints/:complaintId", authenticateToken, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const citizenId = req.user.id;

    const complaint = await Complaint.findOne({
      _id: complaintId,
      complainantId: citizenId, // Ensure citizen can only view their own complaints
    })
      .populate("complainantId", "name nid phone email")
      .populate("assignedOfficerIds", "name rank station");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found or access denied",
      });
    }

    res.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Get complaint error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get complaint details",
      error: error.message,
    });
  }
});

export default router;
