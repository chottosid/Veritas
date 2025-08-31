import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import {
  Citizen,
  Complaint,
  Police,
  Case,
  FIR,
  Notification,
  CaseProceeding,
  Lawyer,
  LawyerRequest,
} from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { uploadToIPFS } from "../utils/ipfs.js";
import { emitComplaintFiled } from "../utils/blockchain.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Citizen Registration with 2FA
router.post("/register", async (req, res) => {
  try {
    const { name, address, dateOfBirth, phone, email, nid, password, otp } =
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

    // OTP verification for citizen registration
    if (otp !== "661233") {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please use the correct verification code.",
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
      const { title, description, area, accused } = req.body;

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

      // Process accused information if provided
      let accusedData = [];
      if (accused && accused.trim()) {
        try {
          const accusedArray = JSON.parse(accused);
          if (Array.isArray(accusedArray) && accusedArray.length > 0) {
            accusedData = accusedArray.map((acc) => ({
              name: acc.name || "",
              address: acc.address || "",
              phone: acc.phone || "",
              email: acc.email || "",
              nid: acc.nid || "",
              age: acc.age || null,
              gender: acc.gender || null,
              occupation: acc.occupation || "",
              relationshipToComplainant: acc.relationshipToComplainant || "",
              addedBy: "CITIZEN",
              addedById: complainantId,
            }));
          }
        } catch (error) {
          console.error("Error parsing accused data:", error);
          // Continue without accused data if parsing fails
        }
      }

      // Create complaint
      const complaint = new Complaint({
        complainantId,
        title,
        description,
        area,
        accused: accusedData,
        attachments,
        status: "PENDING",
      });

      await complaint.save();

      // Populate the response
      await complaint.populate("complainantId", "name nid");

      // Fire-and-forget blockchain event
      emitComplaintFiled({
        complaintId: complaint._id,
        actor: complainantId,
        title: complaint.title,
        area: complaint.area,
        ipfsSummary: attachments.length
          ? attachments.map((a) => a.ipfsHash).join(",")
          : "",
      }).catch(() => {});

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

// Update accused information for a complaint
router.put(
  "/complaints/:complaintId/accused",
  authenticateToken,
  async (req, res) => {
    try {
      const { complaintId } = req.params;
      const citizenId = req.user.id;
      const { accused } = req.body;

      // Verify complaint exists and belongs to the citizen
      const complaint = await Complaint.findOne({
        _id: complaintId,
        complainantId: citizenId,
      });

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found or access denied",
        });
      }

      // Only allow updates if complaint is still pending
      if (complaint.status !== "PENDING") {
        return res.status(400).json({
          success: false,
          message:
            "Cannot update accused information after complaint has been processed",
        });
      }

      // Process accused information
      let accusedData = [];
      if (accused) {
        try {
          const accusedArray = Array.isArray(accused) ? accused : [accused];
          accusedData = accusedArray.map((acc) => ({
            ...acc,
            addedBy: "CITIZEN",
            addedById: citizenId,
          }));
        } catch (error) {
          console.error("Error parsing accused data:", error);
          return res.status(400).json({
            success: false,
            message: "Invalid accused data format",
          });
        }
      }

      // Update complaint with new accused information
      complaint.accused = accusedData;
      await complaint.save();

      res.json({
        success: true,
        message: "Accused information updated successfully",
        data: complaint,
      });
    } catch (error) {
      console.error("Update accused error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update accused information",
        error: error.message,
      });
    }
  }
);

// =============== LAWYER REQUEST SYSTEM ===============

// Get all available lawyers
router.get("/lawyers", authenticateToken, async (req, res) => {
  try {
    const lawyers = await Lawyer.find().select("name firmName bid");

    res.json({
      success: true,
      data: lawyers,
    });
  } catch (error) {
    console.error("Get lawyers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get lawyers",
      error: error.message,
    });
  }
});

// Request a lawyer for a case
router.post(
  "/cases/:caseId/request-lawyer",
  authenticateToken,
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const { lawyerId, message } = req.body;
      const citizenId = req.user.id;

      // Verify the case exists and involves this citizen
      const caseData = await Case.findById(caseId).populate({
        path: "firId",
        populate: {
          path: "complaintId",
          populate: {
            path: "complainantId",
            select: "name nid",
          },
        },
      });

      if (!caseData) {
        return res.status(404).json({
          success: false,
          message: "Case not found",
        });
      }

      // Check if citizen is involved in this case (complainant)
      const complainantId =
        caseData.firId.complaintId.complainantId._id.toString();
      if (complainantId !== citizenId) {
        return res.status(403).json({
          success: false,
          message: "You are not involved in this case",
        });
      }

      // Verify lawyer exists
      const lawyer = await Lawyer.findById(lawyerId);
      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: "Lawyer not found",
        });
      }

      // Check if request already exists
      const existingRequest = await LawyerRequest.findOne({
        citizenId,
        caseId,
        requestedLawyerId: lawyerId,
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: "Request already sent to this lawyer",
        });
      }

      // Create lawyer request
      const lawyerRequest = new LawyerRequest({
        citizenId,
        caseId,
        requestedLawyerId: lawyerId,
        message: message || "",
        status: "PENDING",
      });

      await lawyerRequest.save();

      // Populate the response
      await lawyerRequest.populate("requestedLawyerId", "name firmName");
      await lawyerRequest.populate("caseId", "caseNumber");

      res.status(201).json({
        success: true,
        message: "Lawyer request sent successfully",
        data: lawyerRequest,
      });
    } catch (error) {
      console.error("Request lawyer error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to request lawyer",
        error: error.message,
      });
    }
  }
);

// Get my lawyer requests
router.get("/lawyer-requests", authenticateToken, async (req, res) => {
  try {
    const citizenId = req.user.id;

    const requests = await LawyerRequest.find({ citizenId })
      .populate("requestedLawyerId", "name firmName")
      .populate("caseId", "caseNumber")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Get lawyer requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get lawyer requests",
      error: error.message,
    });
  }
});

// Get case details (citizen view)
router.get("/cases/:caseId", authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const citizenId = req.user.id;

    // Ensure citizen is the complainant of the FIR's complaint
    const caseData = await Case.findById(caseId)
      .populate({
        path: "firId",
        populate: {
          path: "complaintId",
          populate: { path: "complainantId", select: "_id name nid phone" },
        },
      })
      .populate("assignedJudgeId", "name courtName")
      .populate("accusedLawyerId", "name firmName")
      .populate("prosecutorLawyerId", "name firmName")
      .populate("investigatingOfficerIds", "name rank station");

    if (!caseData) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    const complainantId =
      caseData.firId?.complaintId?.complainantId?._id?.toString();
    if (complainantId !== citizenId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, data: caseData });
  } catch (error) {
    console.error("Get case details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get case details",
      error: error.message,
    });
  }
});

// Get proceedings for a case (citizen view)
router.get(
  "/cases/:caseId/proceedings",
  authenticateToken,
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const citizenId = req.user.id;

      // Ensure citizen is the complainant of the FIR's complaint
      const caseData = await Case.findById(caseId).populate({
        path: "firId",
        populate: {
          path: "complaintId",
          populate: { path: "complainantId", select: "_id" },
        },
      });

      if (!caseData) {
        return res
          .status(404)
          .json({ success: false, message: "Case not found" });
      }

      const complainantId =
        caseData.firId?.complaintId?.complainantId?._id?.toString();
      if (complainantId !== citizenId) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }

      const proceedings = await CaseProceeding.find({ caseId }).sort({
        createdAt: -1,
      });

      res.json({ success: true, data: proceedings });
    } catch (error) {
      console.error("Get case proceedings error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get case proceedings",
        error: error.message,
      });
    }
  }
);

// =============== NOTIFICATIONS ===============

// Get my notifications
router.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const citizenId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = {
      recipientId: citizenId,
      recipientType: "CITIZEN",
    };

    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate("caseId", "caseNumber")
      .populate("complaintId", "title")
      .populate("firId", "firNumber")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notifications",
      error: error.message,
    });
  }
});

// Mark notification as read
router.put(
  "/notifications/:notificationId/read",
  authenticateToken,
  async (req, res) => {
    try {
      const { notificationId } = req.params;
      const citizenId = req.user.id;

      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipientId: citizenId,
          recipientType: "CITIZEN",
        },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.json({
        success: true,
        message: "Notification marked as read",
        data: notification,
      });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark notification as read",
        error: error.message,
      });
    }
  }
);

// Mark all notifications as read
router.put("/notifications/read-all", authenticateToken, async (req, res) => {
  try {
    const citizenId = req.user.id;

    const result = await Notification.updateMany(
      {
        recipientId: citizenId,
        recipientType: "CITIZEN",
        isRead: false,
      },
      { isRead: true }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
});

export default router;
