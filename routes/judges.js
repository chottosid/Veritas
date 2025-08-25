import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  Judge,
  FIR,
  Case,
  Notification,
  CaseProceeding,
} from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { appendCaseProceeding } from "../utils/ipfs.js";
import { emitCaseCreated, emitCaseUpdated } from "../utils/blockchain.js";

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
      .populate("complaintId", "title description area complainantId")
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

// =============== CASE MANAGEMENT ===============

// Convert FIR to case
router.post("/firs/:firId/case", authenticateToken, async (req, res) => {
  try {
    const { firId } = req.params;
    const judgeId = req.user.id;
    const { caseNumber } = req.body;

    // Verify FIR exists and is submitted to this judge
    const fir = await FIR.findOne({
      _id: firId,
      submittedToJudge: judgeId,
    });

    if (!fir) {
      return res.status(404).json({
        success: false,
        message: "FIR not found or not submitted to you",
      });
    }

    // Check if case already exists for this FIR
    const existingCase = await Case.findOne({ firId });
    if (existingCase) {
      return res.status(400).json({
        success: false,
        message: "Case already exists for this FIR",
      });
    }

    // Create new case
    const newCase = new Case({
      firId,
      caseNumber,
      assignedJudgeId: judgeId,
      status: "PENDING",
    });

    await newCase.save();

    // Append proceeding: CASE_CREATED
    await appendCaseProceeding(CaseProceeding, {
      caseId: newCase._id,
      type: "CASE_CREATED",
      createdByRole: "JUDGE",
      createdById: judgeId,
      description: `Case ${caseNumber} created from FIR`,
      metadata: { firId },
    });

    // Emit chain event (non-blocking)
    emitCaseCreated({
      firId: newCase.firId,
      caseId: newCase._id,
      caseNumber: newCase.caseNumber,
    }).catch(() => {});

    // Populate the response
    await newCase.populate("firId");
    await newCase.populate("assignedJudgeId", "name courtName");

    res.status(201).json({
      success: true,
      message: "Case created successfully",
      data: newCase,
    });
  } catch (error) {
    console.error("Create case error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create case",
      error: error.message,
    });
  }
});

// Get all cases assigned to me
router.get("/cases", authenticateToken, async (req, res) => {
  try {
    const judgeId = req.user.id;

    const cases = await Case.find({ assignedJudgeId: judgeId })
      .populate("firId")
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
    console.error("Get judge cases error:", error);
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
    const judgeId = req.user.id;

    const caseData = await Case.findOne({
      _id: caseId,
      assignedJudgeId: judgeId,
    })
      .populate("firId")
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

// Schedule hearing date
router.post("/cases/:caseId/hearing", authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const judgeId = req.user.id;
    const { hearingDate } = req.body;

    // Verify case exists and is assigned to this judge
    const caseData = await Case.findOne({
      _id: caseId,
      assignedJudgeId: judgeId,
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found or not assigned to you",
      });
    }

    // Add hearing date
    caseData.hearingDates.push(new Date(hearingDate));
    caseData.status = "ONGOING";
    await caseData.save();

    // Append proceeding: HEARING_SCHEDULED
    await appendCaseProceeding(CaseProceeding, {
      caseId: caseData._id,
      type: "HEARING_SCHEDULED",
      createdByRole: "JUDGE",
      createdById: judgeId,
      description: `Hearing scheduled on ${hearingDate}`,
      metadata: { hearingDate: new Date(hearingDate) },
    });

    // Emit chain event (non-blocking)
    emitCaseUpdated({
      caseId: caseData._id,
      updateType: "HEARING_SCHEDULED",
      description: `Hearing scheduled on ${hearingDate}`,
    }).catch(() => {});

    // Populate the response
    await caseData.populate("firId");
    await caseData.populate("assignedJudgeId", "name courtName");

    res.json({
      success: true,
      message: "Hearing date scheduled successfully",
      data: caseData,
    });
  } catch (error) {
    console.error("Schedule hearing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to schedule hearing",
      error: error.message,
    });
  }
});

// Close case with verdict
router.post("/cases/:caseId/close", authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const judgeId = req.user.id;
    const { verdict } = req.body;

    // Verify case exists and is assigned to this judge
    const caseData = await Case.findOne({
      _id: caseId,
      assignedJudgeId: judgeId,
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found or not assigned to you",
      });
    }

    // Close case
    caseData.status = "CLOSED";
    caseData.verdict = verdict;
    await caseData.save();

    // Append proceeding: JUDGMENT / STATUS_CHANGED
    await appendCaseProceeding(CaseProceeding, {
      caseId: caseData._id,
      type: "JUDGMENT",
      createdByRole: "JUDGE",
      createdById: judgeId,
      description: `Case closed with verdict`,
      metadata: { verdict },
    });

    // Emit chain event (non-blocking)
    emitCaseUpdated({
      caseId: caseData._id,
      updateType: "JUDGMENT",
      description: `Case closed with verdict`,
    }).catch(() => {});

    // Populate the response
    await caseData.populate("firId");
    await caseData.populate("assignedJudgeId", "name courtName");

    res.json({
      success: true,
      message: "Case closed successfully",
      data: caseData,
    });
  } catch (error) {
    console.error("Close case error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to close case",
      error: error.message,
    });
  }
});

// =============== NOTIFICATIONS ===============

// Get my notifications
router.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const judgeId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = {
      recipientId: judgeId,
      recipientType: "JUDGE",
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
      const judgeId = req.user.id;

      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipientId: judgeId,
          recipientType: "JUDGE",
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
    const judgeId = req.user.id;

    const result = await Notification.updateMany(
      {
        recipientId: judgeId,
        recipientType: "JUDGE",
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

// Get proceedings for a case (judge view)
router.get(
  "/cases/:caseId/proceedings",
  authenticateToken,
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const judgeId = req.user.id;

      // Ensure judge has access to this case
      const caseData = await Case.findOne({
        _id: caseId,
        assignedJudgeId: judgeId,
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

export default router;
