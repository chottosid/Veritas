import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import {
  Judge,
  FIR,
  Case,
  Notification,
  CaseProceeding,
  LawyerRequest,
} from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { uploadToIPFS } from "../utils/ipfs.js";
import { appendCaseProceeding } from "../utils/caseProceedings.js";
import { notifyCaseParties } from "../utils/notifications.js";
import { emitCaseCreated, emitCaseUpdated } from "../utils/blockchain.js";
import NotificationService from "../utils/notifications.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

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

    const firs = await FIR.find({
      submittedToJudge: judgeId,
      status: "PENDING", // Only show FIRs that haven't been converted to cases yet
    })
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

// =============== FIR MANAGEMENT ===============

// Create Case from FIR
router.post("/firs/:firId/case", authenticateToken, async (req, res) => {
  try {
    const { firId } = req.params;
    const judgeId = req.user.id;
    const { caseNumber } = req.body;

    if (!caseNumber) {
      return res.status(400).json({
        success: false,
        message: "Case number is required",
      });
    }

    // Verify FIR exists and is submitted to this judge
    const fir = await FIR.findOne({
      _id: firId,
      submittedToJudge: judgeId,
    }).populate("complaintId");

    if (!fir) {
      return res.status(404).json({
        success: false,
        message: "FIR not found or not submitted to you",
      });
    }

    // Check if FIR is already converted to case
    if (fir.status === "CASE_CREATED") {
      return res.status(400).json({
        success: false,
        message: "Case already exists for this FIR",
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

    // Check if case number is unique
    const existingCaseNumber = await Case.findOne({ caseNumber });
    if (existingCaseNumber) {
      return res.status(400).json({
        success: false,
        message: "Case number already exists",
      });
    }

    // Create new case
    const newCase = new Case({
      firId: fir._id,
      caseNumber,
      assignedJudgeId: judgeId,
      status: "PENDING",
      investigatingOfficerIds: fir.complaintId.assignedOfficerIds || [],
    });

    await newCase.save();

    // Update FIR status to indicate case has been created
    fir.status = "CASE_CREATED";
    await fir.save();

    // Create case proceeding record for case creation
    await appendCaseProceeding(CaseProceeding, {
      caseId: newCase._id,
      type: "CASE_CREATED",
      createdByRole: "JUDGE",
      createdById: judgeId,
      description: `Case ${caseNumber} created from FIR ${fir.firNumber}`,
    });

    // Create a case proceeding record documenting all accumulated documents from FIR
    if (fir.attachments && fir.attachments.length > 0) {
      await appendCaseProceeding(CaseProceeding, {
        caseId: newCase._id,
        type: "DOCUMENT_FILED",
        createdByRole: "SYSTEM",
        createdById: judgeId,
        description: `Case created with ${fir.attachments.length} accumulated documents from complaint and FIR`,
        attachments: fir.attachments,
      });
    }

    // Emit blockchain event
    await emitCaseCreated({
      caseId: newCase._id.toString(),
      firId: fir._id.toString(),
      caseNumber,
      judgeId: judgeId.toString(),
      complaintId: fir.complaintId._id.toString(),
    });

    // Notify police officers about case creation
    if (
      fir.complaintId.assignedOfficerIds &&
      fir.complaintId.assignedOfficerIds.length > 0
    ) {
      for (const officerId of fir.complaintId.assignedOfficerIds) {
        await NotificationService.createNotification(Notification, {
          recipientId: officerId,
          recipientType: "POLICE",
          title: "Case Created",
          message: `Case ${caseNumber} has been created from your FIR ${fir.firNumber}`,
          type: "CASE_CREATED",
          caseId: newCase._id,
          firId: fir._id,
        });
      }
    }

    // Notify complainant about case creation
    await NotificationService.createNotification(Notification, {
      recipientId: fir.complaintId.complainantId,
      recipientType: "CITIZEN",
      title: "Case Created",
      message: `Case ${caseNumber} has been created from your complaint`,
      type: "CASE_CREATED",
      caseId: newCase._id,
      firId: fir._id,
    });

    res.status(201).json({
      success: true,
      message: "Case created successfully",
      data: {
        caseId: newCase._id,
        caseNumber,
        firNumber: fir.firNumber,
      },
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

// =============== CASE MANAGEMENT ===============

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

    // Get lawyer requests for all cases
    const caseIds = cases.map((case_) => case_._id);
    const lawyerRequests = await LawyerRequest.find({
      caseId: { $in: caseIds },
    })
      .populate("requestedLawyerId", "name firmName")
      .populate("citizenId", "name nid phone");

    // Get case proceedings for document counts
    const caseProceedings = await CaseProceeding.find({
      caseId: { $in: caseIds },
    }).select("caseId attachments");

    // Attach lawyer requests and document counts to cases
    const casesWithLawyers = cases.map((case_) => {
      const caseLawyerRequests = lawyerRequests.filter(
        (req) => req.caseId.toString() === case_._id.toString()
      );

      // Count documents from case proceedings
      const caseProceedingDocs = caseProceedings
        .filter((proc) => proc.caseId.toString() === case_._id.toString())
        .reduce((total, proc) => total + (proc.attachments?.length || 0), 0);

      // Count documents from complaint and FIR
      const complaintDocs = case_.firId.complaintId.attachments?.length || 0;
      const firDocs = case_.firId.attachments?.length || 0;

      const totalDocuments = caseProceedingDocs + complaintDocs + firDocs;

      return {
        ...case_.toObject(),
        lawyerRequests: caseLawyerRequests,
        documentCount: totalDocuments,
      };
    });

    res.json({
      success: true,
      data: casesWithLawyers,
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

// Test endpoint to check if judge routes are working
router.get("/test", authenticateToken, async (req, res) => {
  res.json({
    success: true,
    message: "Judge routes are working",
    user: req.user,
  });
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
      .populate("accusedLawyerId", "name firmName")
      .populate("prosecutorLawyerId", "name firmName")
      .populate("investigatingOfficerIds", "name rank station")
      .populate({
        path: "firId",
        populate: [
          {
            path: "complaintId",
            populate: [
              {
                path: "complainantId",
                select: "name nid phone",
              },
              {
                path: "accused",
                select:
                  "name address phone email nid age gender occupation relationshipToComplainant addedBy addedById",
              },
            ],
          },
          {
            path: "accused",
            select:
              "name address phone email nid age gender occupation relationshipToComplainant addedBy addedById",
          },
        ],
      });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found or not assigned to you",
      });
    }

    console.log("Case data found:", {
      caseId: caseData._id,
      firId: caseData.firId?._id,
      complaintId: caseData.firId?.complaintId?._id,
      complaintAttachments:
        caseData.firId?.complaintId?.attachments?.length || 0,
      firAttachments: caseData.firId?.attachments?.length || 0,
    });

    // Get lawyer requests for this case
    const lawyerRequests = await LawyerRequest.find({ caseId: caseId })
      .populate("requestedLawyerId", "name firmName")
      .populate("citizenId", "name nid phone");

    // Get all case proceedings with attachments
    const caseProceedings = await CaseProceeding.find({ caseId: caseId })
      .populate("createdById", "name")
      .sort({ at: -1 });

    // Get all documents from case proceedings
    const caseDocuments = [];
    caseProceedings.forEach((proceeding) => {
      if (proceeding.attachments && proceeding.attachments.length > 0) {
        proceeding.attachments.forEach((doc) => {
          caseDocuments.push({
            fileName: doc.fileName,
            ipfsHash: doc.ipfsHash,
            fileSize: doc.fileSize,
            uploadedAt: doc.uploadedAt,
            documentSource: "CASE_PROCEEDING",
            proceedingType: proceeding.type,
            proceedingDescription: proceeding.description,
            createdByRole: proceeding.createdByRole,
            createdAt: proceeding.at,
          });
        });
      }
    });

    // Get documents from complaint
    const complaintDocuments = [];
    if (
      caseData.firId &&
      caseData.firId.complaintId &&
      caseData.firId.complaintId.attachments
    ) {
      caseData.firId.complaintId.attachments.forEach((doc) => {
        complaintDocuments.push({
          fileName: doc.fileName,
          ipfsHash: doc.ipfsHash,
          fileSize: doc.fileSize,
          uploadedAt: doc.uploadedAt,
          documentSource: "COMPLAINT",
          proceedingType: "COMPLAINT_FILED",
          proceedingDescription: "Documents attached during complaint filing",
          createdByRole: "CITIZEN",
          createdAt: doc.uploadedAt,
        });
      });
    }

    // Get documents from FIR
    const firDocuments = [];
    if (caseData.firId && caseData.firId.attachments) {
      caseData.firId.attachments.forEach((doc) => {
        firDocuments.push({
          fileName: doc.fileName,
          ipfsHash: doc.ipfsHash,
          fileSize: doc.fileSize,
          uploadedAt: doc.uploadedAt,
          documentSource: "FIR",
          proceedingType: "FIR_REGISTERED",
          proceedingDescription: "Documents attached during FIR registration",
          createdByRole: "POLICE",
          createdAt: doc.uploadedAt,
        });
      });
    }

    // Combine all documents and deduplicate by ipfsHash
    const allDocuments = [
      ...complaintDocuments,
      ...firDocuments,
      ...caseDocuments,
    ];

    // Deduplicate documents by ipfsHash to prevent duplicates
    const uniqueDocuments = allDocuments.filter(
      (doc, index, self) =>
        index === self.findIndex((d) => d.ipfsHash === doc.ipfsHash)
    );

    // Sort by creation date
    const sortedDocuments = uniqueDocuments.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    console.log("Documents found:", {
      complaintDocuments: complaintDocuments.length,
      firDocuments: firDocuments.length,
      caseDocuments: caseDocuments.length,
      totalDocuments: sortedDocuments.length,
      uniqueDocuments: uniqueDocuments.length,
    });

    // Aggregate all accused information from complaint and FIR
    const complaintAccused = caseData.firId.complaintId.accused || [];
    const firAccused = caseData.firId.accused || [];

    // Combine and deduplicate accused information
    const allAccused = [...complaintAccused, ...firAccused];
    const uniqueAccused = allAccused.filter(
      (accused, index, self) =>
        index ===
        self.findIndex(
          (a) => a.name === accused.name && a.address === accused.address
        )
    );

    // Combine case data with lawyer requests, documents, and accused information
    const caseWithLawyers = {
      ...caseData.toObject(),
      lawyerRequests: lawyerRequests,
      allDocuments: sortedDocuments,
      allAccused: uniqueAccused,
    };

    res.json({
      success: true,
      data: caseWithLawyers,
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

    // Notify all parties about hearing
    await notifyCaseParties(Notification, {
      caseId: caseData._id,
      firId: caseData.firId,
      complaintId: caseData.firId?.complaintId,
      title: "Hearing Scheduled",
      message: `Hearing scheduled for case ${caseData.caseNumber} on ${hearingDate}`,
      type: "HEARING_SCHEDULED",
      metadata: { hearingDate: new Date(hearingDate) },
      excludeRecipients: [judgeId], // Don't notify the judge who scheduled it
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

// Add order to case
router.post(
  "/cases/:caseId/order",
  authenticateToken,
  upload.array("attachments", 5),
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const judgeId = req.user.id;
      const { orderText } = req.body;

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
          }
        }
      }

      // Append proceeding: ORDER_PASSED
      await appendCaseProceeding(CaseProceeding, {
        caseId: caseData._id,
        type: "ORDER_PASSED",
        createdByRole: "JUDGE",
        createdById: judgeId,
        description: orderText,
        attachments,
        metadata: { orderType: "JUDGE_ORDER" },
      });

      // Notify all parties about the order
      await notifyCaseParties(Notification, {
        caseId: caseData._id,
        firId: caseData.firId,
        complaintId: caseData.firId?.complaintId,
        title: "Order Passed",
        message: `New order passed in case ${caseData.caseNumber}`,
        type: "ORDER_PASSED",
        metadata: { orderText },
        excludeRecipients: [judgeId], // Don't notify the judge who passed the order
      });

      // Emit chain event (non-blocking)
      emitCaseUpdated({
        caseId: caseData._id,
        updateType: "ORDER_PASSED",
        description: orderText,
      }).catch(() => {});

      res.json({
        success: true,
        message: "Order added successfully",
        data: { caseId, orderText, attachments },
      });
    } catch (error) {
      console.error("Add order error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add order",
        error: error.message,
      });
    }
  }
);

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

    // Append proceeding: JUDGMENT
    await appendCaseProceeding(CaseProceeding, {
      caseId: caseData._id,
      type: "JUDGMENT",
      createdByRole: "JUDGE",
      createdById: judgeId,
      description: `Case closed with verdict: ${verdict}`,
      metadata: { verdict },
    });

    // Notify all parties about case closure
    await notifyCaseParties(Notification, {
      caseId: caseData._id,
      firId: caseData.firId,
      complaintId: caseData.firId?.complaintId,
      title: "Case Closed",
      message: `Case ${caseData.caseNumber} has been closed with verdict`,
      type: "CASE_CLOSED",
      metadata: { verdict },
      excludeRecipients: [judgeId], // Don't notify the judge who closed it
    });

    // Emit chain event (non-blocking)
    emitCaseUpdated({
      caseId: caseData._id,
      updateType: "JUDGMENT",
      description: `Case closed with verdict: ${verdict}`,
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

// Add accused person to case
router.post("/cases/:caseId/accused", authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const judgeId = req.user.id;
    const {
      name,
      address,
      phone,
      email,
      nid,
      age,
      gender,
      occupation,
      relationshipToComplainant,
    } = req.body;

    // Validate required fields
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: "Name and address are required",
      });
    }

    // Ensure judge has access to this case
    const caseData = await Case.findOne({
      _id: caseId,
      assignedJudgeId: judgeId,
    }).populate("firId");

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found or not assigned to you",
      });
    }

    // Create new accused person
    const newAccused = {
      name,
      address,
      phone: phone || "",
      email: email || "",
      nid: nid || "",
      age: age || undefined,
      gender: gender || undefined,
      occupation: occupation || "",
      relationshipToComplainant: relationshipToComplainant || "",
      addedBy: "JUDGE",
      addedById: judgeId,
    };

    // Add accused to FIR
    const fir = await FIR.findById(caseData.firId._id);
    fir.accused.push(newAccused);
    await fir.save();

    // Create case proceeding record
    await appendCaseProceeding(CaseProceeding, {
      caseId: caseData._id,
      type: "STATUS_CHANGED",
      createdByRole: "JUDGE",
      createdById: judgeId,
      description: `Added accused person: ${name}`,
      metadata: { accusedName: name, action: "ADDED_ACCUSED" },
    });

    // Emit blockchain event
    await emitCaseUpdated({
      caseId: caseData._id.toString(),
      updateType: "ACCUSED_ADDED",
      updatedBy: judgeId.toString(),
      metadata: { accusedName: name },
    });

    // Notify investigating officers
    if (
      caseData.investigatingOfficerIds &&
      caseData.investigatingOfficerIds.length > 0
    ) {
      for (const officerId of caseData.investigatingOfficerIds) {
        await NotificationService.createNotification(Notification, {
          recipientId: officerId,
          recipientType: "POLICE",
          title: "Accused Added to Case",
          message: `New accused person "${name}" has been added to case ${caseData.caseNumber}`,
          type: "STATUS_CHANGED",
          caseId: caseData._id,
          metadata: { accusedName: name },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Accused person added successfully",
      data: newAccused,
    });
  } catch (error) {
    console.error("Add accused error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add accused person",
      error: error.message,
    });
  }
});

// Attach document to case (orders, summons, etc.)
router.post(
  "/cases/:caseId/documents",
  authenticateToken,
  upload.array("documents", 5),
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const judgeId = req.user.id;
      const { documentType, description } = req.body;

      if (!documentType || !req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Document type and files are required",
        });
      }

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

      // Upload documents to IPFS
      const uploadedDocuments = [];
      for (const file of req.files) {
        const uploadResult = await uploadToIPFS(file.buffer, file.originalname);
        if (uploadResult.success) {
          uploadedDocuments.push({
            fileName: file.originalname,
            ipfsHash: uploadResult.ipfsHash,
            fileSize: file.size,
            documentType: documentType,
            description: description || "",
            uploadedBy: judgeId,
            uploadedAt: new Date(),
          });
        } else {
          console.error("Failed to upload file to IPFS:", uploadResult.error);
        }
      }

      if (uploadedDocuments.length === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to upload documents",
        });
      }

      // Create case proceeding record
      await appendCaseProceeding(CaseProceeding, {
        caseId: caseData._id,
        type: "DOCUMENT_FILED",
        createdByRole: "JUDGE",
        createdById: judgeId,
        description: `Filed ${documentType}: ${uploadedDocuments
          .map((doc) => doc.fileName)
          .join(", ")}`,
        attachments: uploadedDocuments,
        metadata: { documentType, fileCount: uploadedDocuments.length },
      });

      // Emit blockchain event
      await emitCaseUpdated({
        caseId: caseData._id.toString(),
        updateType: "DOCUMENT_FILED",
        updatedBy: judgeId.toString(),
        metadata: { documentType, fileCount: uploadedDocuments.length },
      });

      // Notify all parties about document filing
      await notifyCaseParties(Notification, {
        caseId: caseData._id,
        title: `${documentType} Filed`,
        message: `New ${documentType.toLowerCase()} has been filed in case ${
          caseData.caseNumber
        }`,
        type: "DOCUMENT_FILED",
        metadata: { documentType, fileCount: uploadedDocuments.length },
        excludeRecipients: [judgeId], // Don't notify the judge who filed it
      });

      res.status(201).json({
        success: true,
        message: "Documents attached successfully",
        data: {
          documents: uploadedDocuments,
          documentType,
          fileCount: uploadedDocuments.length,
        },
      });
    } catch (error) {
      console.error("Attach documents error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to attach documents",
        error: error.message,
      });
    }
  }
);

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
