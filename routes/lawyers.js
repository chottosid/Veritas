import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import {
  Lawyer,
  LawyerRequest,
  Case,
  FIR,
  Notification,
  CaseProceeding,
} from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { uploadToIPFS } from "../utils/ipfs.js";
import { appendCaseProceeding } from "../utils/caseProceedings.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

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

// =============== LAWYER REQUEST MANAGEMENT ===============

// Get lawyer requests sent to me
router.get("/requests", authenticateToken, async (req, res) => {
  try {
    const lawyerId = req.user.id;

    const requests = await LawyerRequest.find({ requestedLawyerId: lawyerId })
      .populate("citizenId", "name nid phone")
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
      message: "Failed to get requests",
      error: error.message,
    });
  }
});

// Accept or reject lawyer request
router.put("/requests/:requestId", authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // "ACCEPTED" or "REJECTED"
    const lawyerId = req.user.id;

    // Verify request exists and is for this lawyer
    const request = await LawyerRequest.findOne({
      _id: requestId,
      requestedLawyerId: lawyerId,
      status: "PENDING",
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found or already processed",
      });
    }

    // Update request status
    request.status = status;
    await request.save();

    // If accepted, update the case with lawyer assignment
    if (status === "ACCEPTED") {
      const caseData = await Case.findById(request.caseId);
      if (caseData) {
        // Determine if this is accused or prosecutor lawyer based on case details
        // For simplicity, we'll assign as accused lawyer if not already assigned
        if (!caseData.accusedLawyerId) {
          caseData.accusedLawyerId = lawyerId;
        } else if (!caseData.prosecutorLawyerId) {
          caseData.prosecutorLawyerId = lawyerId;
        }
        await caseData.save();
      }
    }

    // Populate the response
    await request.populate("citizenId", "name nid phone");
    await request.populate("caseId", "caseNumber");

    res.json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`,
      data: request,
    });
  } catch (error) {
    console.error("Update request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update request",
      error: error.message,
    });
  }
});

// =============== CASE MANAGEMENT ===============

// Get my assigned cases
router.get("/cases", authenticateToken, async (req, res) => {
  try {
    const lawyerId = req.user.id;

    const cases = await Case.find({
      $or: [{ accusedLawyerId: lawyerId }, { prosecutorLawyerId: lawyerId }],
    })
      .populate("firId")
      .populate("assignedJudgeId", "name courtName")
      .populate("accusedLawyerId", "name firmName")
      .populate("prosecutorLawyerId", "name firmName")
      .populate("investigatingOfficerIds", "name rank station")
      .populate({
        path: "firId",
        populate: {
          path: "complaintId",
          populate: {
            path: "complainantId",
            select: "name nid phone",
          },
        },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: cases,
    });
  } catch (error) {
    console.error("Get lawyer cases error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cases",
      error: error.message,
    });
  }
});

// Get case details
router.get("/cases/:caseId", authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const lawyerId = req.user.id;

    const caseData = await Case.findOne({
      _id: caseId,
      $or: [{ accusedLawyerId: lawyerId }, { prosecutorLawyerId: lawyerId }],
    })
      .populate("firId")
      .populate("assignedJudgeId", "name courtName")
      .populate("accusedLawyerId", "name firmName")
      .populate("prosecutorLawyerId", "name firmName")
      .populate("investigatingOfficerIds", "name rank station")
      .populate({
        path: "firId",
        populate: {
          path: "complaintId",
          populate: {
            path: "complainantId",
            select: "name nid phone",
          },
        },
      });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found or not assigned to you",
      });
    }

    res.json({
      success: true,
      data: caseData,
    });
  } catch (error) {
    console.error("Get case details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get case details",
      error: error.message,
    });
  }
});

// Submit documents for case (with IPFS upload)
router.post(
  "/cases/:caseId/documents",
  authenticateToken,
  upload.array("documents", 5),
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const lawyerId = req.user.id;
      const { documentType, description } = req.body;

      // Verify case exists and lawyer is assigned
      const caseData = await Case.findOne({
        _id: caseId,
        $or: [{ accusedLawyerId: lawyerId }, { prosecutorLawyerId: lawyerId }],
      });

      if (!caseData) {
        return res.status(404).json({
          success: false,
          message: "Case not found or not assigned to you",
        });
      }

      // Process document uploads
      const documents = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const uploadResult = await uploadToIPFS(
            file.buffer,
            file.originalname
          );
          if (uploadResult.success) {
            documents.push({
              fileName: file.originalname,
              ipfsHash: uploadResult.ipfsHash,
              fileSize: file.size,
              documentType: documentType || "GENERAL",
              description: description || "",
              uploadedBy: lawyerId,
              uploadedAt: new Date(),
            });
          } else {
            console.error("Failed to upload file to IPFS:", uploadResult.error);
          }
        }
      }

      // Append proceeding: DOCUMENT_FILED or EVIDENCE_SUBMITTED
      await appendCaseProceeding(CaseProceeding, {
        caseId: caseData._id,
        type:
          documentType === "EVIDENCE" ? "EVIDENCE_SUBMITTED" : "DOCUMENT_FILED",
        createdByRole: "LAWYER",
        createdById: lawyerId,
        description: description || "Document(s) submitted",
        attachments: documents.map((d) => ({
          fileName: d.fileName,
          ipfsHash: d.ipfsHash,
          fileSize: d.fileSize,
        })),
        metadata: { documentType: documentType || "GENERAL" },
      });

      // Notify all parties about document submission
      const { notifyCaseParties } = await import("../utils/notifications.js");
      await notifyCaseParties(Notification, {
        caseId: caseData._id,
        firId: caseData.firId,
        complaintId: caseData.firId?.complaintId,
        title: "Documents Submitted",
        message: `New documents submitted in case ${caseData.caseNumber}`,
        type:
          documentType === "EVIDENCE" ? "EVIDENCE_SUBMITTED" : "DOCUMENT_FILED",
        metadata: { documentType: documentType || "GENERAL", description },
        excludeRecipients: [lawyerId], // Don't notify the lawyer who submitted
      });

      // Add documents to case (placeholder response)
      res.json({
        success: true,
        message: "Documents submitted successfully",
        data: {
          caseId,
          documents,
        },
      });
    } catch (error) {
      console.error("Submit documents error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit documents",
        error: error.message,
      });
    }
  }
);

// Get proceedings for a case (lawyer view)
router.get(
  "/cases/:caseId/proceedings",
  authenticateToken,
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const lawyerId = req.user.id;

      const caseData = await Case.findOne({
        _id: caseId,
        $or: [{ accusedLawyerId: lawyerId }, { prosecutorLawyerId: lawyerId }],
      });

      if (!caseData) {
        return res.status(404).json({
          success: false,
          message: "Case not found or not assigned to you",
        });
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
    const lawyerId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = {
      recipientId: lawyerId,
      recipientType: "LAWYER",
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
      const lawyerId = req.user.id;

      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipientId: lawyerId,
          recipientType: "LAWYER",
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
    const lawyerId = req.user.id;

    const result = await Notification.updateMany(
      {
        recipientId: lawyerId,
        recipientType: "LAWYER",
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
