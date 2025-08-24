import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import { Police, Complaint, FIR, Judge } from "../models/index.js";
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

// Police Registration
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      address,
      dateOfBirth,
      phone,
      email,
      pid,
      rank,
      station,
      isOC,
      password,
    } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if police officer already exists
    const existingPolice = await Police.findOne({
      $or: [{ pid }, { phone: phone || null }, { email: email || null }],
    });

    if (existingPolice) {
      return res.status(400).json({
        success: false,
        message: "Police officer already exists with this PID, phone, or email",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new police officer
    const police = new Police({
      name,
      address,
      dateOfBirth,
      phone,
      email,
      pid,
      rank,
      station,
      isOC: isOC || false,
      password: hashedPassword,
    });

    await police.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: police._id,
        role: "police",
        pid: police.pid,
        isOC: police.isOC,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.status(201).json({
      success: true,
      message: "Police officer registered successfully",
      data: {
        id: police._id,
        name: police.name,
        pid: police.pid,
        rank: police.rank,
        station: police.station,
        isOC: police.isOC,
        token,
      },
    });
  } catch (error) {
    console.error("Police registration error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register police officer",
      error: error.message,
    });
  }
});

// Police Login
router.post("/login", async (req, res) => {
  try {
    const { pid, password } = req.body;

    if (!pid || !password) {
      return res.status(400).json({
        success: false,
        message: "PID and password are required",
      });
    }

    // Find police officer by PID
    const police = await Police.findOne({ pid });

    if (!police) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, police.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: police._id,
        role: "police",
        pid: police.pid,
        isOC: police.isOC,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: police._id,
        name: police.name,
        pid: police.pid,
        rank: police.rank,
        station: police.station,
        isOC: police.isOC,
        token,
      },
    });
  } catch (error) {
    console.error("Police login error:", error);
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
    const policeId = req.user.id;

    const police = await Police.findById(policeId).select("-password");
    if (!police) {
      return res.status(404).json({
        success: false,
        message: "Police officer not found",
      });
    }

    res.json({
      success: true,
      data: police,
    });
  } catch (error) {
    console.error("Get police profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: error.message,
    });
  }
});

// Get my assigned complaints
router.get("/complaints", authenticateToken, async (req, res) => {
  try {
    const policeId = req.user.id;

    const complaints = await Complaint.find({
      assignedOfficerIds: policeId,
    })
      .populate("complainantId", "name nid phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    console.error("Get police complaints error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get complaints",
      error: error.message,
    });
  }
});

// Convert complaint to FIR
router.post(
  "/complaints/:complaintId/fir",
  authenticateToken,
  upload.array("attachments", 5),
  async (req, res) => {
    try {
      const { complaintId } = req.params;
      const policeId = req.user.id;
      const { firNumber, sections, judgeId } = req.body;

      // Verify complaint exists and is assigned to this officer
      const complaint = await Complaint.findOne({
        _id: complaintId,
        assignedOfficerIds: policeId,
      });

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found or not assigned to you",
        });
      }

      // Check if FIR already exists for this complaint
      const existingFir = await FIR.findOne({ complaintId });
      if (existingFir) {
        return res.status(400).json({
          success: false,
          message: "FIR already registered for this complaint",
        });
      }

      // Verify judge exists if provided
      if (judgeId) {
        const judge = await Judge.findById(judgeId);
        if (!judge) {
          return res.status(404).json({
            success: false,
            message: "Judge not found",
          });
        }
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
          }
        }
      }

      // Create FIR
      const fir = new FIR({
        complaintId,
        firNumber,
        sections: Array.isArray(sections) ? sections : [sections],
        registeredBy: policeId,
        submittedToJudge: judgeId || null,
        attachments,
      });

      await fir.save();

      // Update complaint status
      complaint.status = "FIR_REGISTERED";
      await complaint.save();

      // Populate the response
      await fir.populate("registeredBy", "name pid rank station");
      await fir.populate("submittedToJudge", "name courtName");
      await fir.populate("complaintId", "title description area");

      res.status(201).json({
        success: true,
        message: "FIR registered successfully",
        data: fir,
      });
    } catch (error) {
      console.error("Register FIR error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to register FIR",
        error: error.message,
      });
    }
  }
);

// Get all judges (for FIR submission)
router.get("/judges", authenticateToken, async (req, res) => {
  try {
    const judges = await Judge.find().select("name courtName jid");

    res.json({
      success: true,
      data: judges,
    });
  } catch (error) {
    console.error("Get judges error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get judges",
      error: error.message,
    });
  }
});

export default router;
