import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import {
  Police,
  Complaint,
  FIR,
  Judge,
  Notification,
  Case,
  CaseProceeding,
} from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { uploadToIPFS } from "../utils/ipfs.js";
import { appendCaseProceeding } from "../utils/caseProceedings.js";
import { emitFIRRegistered, emitCaseUpdated } from "../utils/blockchain.js";
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

// Get complaint details
router.get("/complaints/:complaintId", authenticateToken, async (req, res) => {
  try {
    const policeId = req.user.id;
    const { complaintId } = req.params;

    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedOfficerIds: policeId,
    })
      .populate("complainantId", "name nid phone email address")
      .populate("assignedOfficerIds", "name pid rank station");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found or not assigned to you",
      });
    }

    // Check if FIR already exists for this complaint
    const existingFir = await FIR.findOne({ complaintId }).populate(
      "submittedToJudge",
      "name courtName"
    );

    res.json({
      success: true,
      data: {
        ...complaint.toObject(),
        hasFIR: !!existingFir,
        fir: existingFir || null,
      },
    });
  } catch (error) {
    console.error("Get complaint details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get complaint details",
      error: error.message,
    });
  }
});

// Update accused information in FIR
router.put("/fir/:firId/accused", authenticateToken, async (req, res) => {
  try {
    const { firId } = req.params;
    const policeId = req.user.id;
    const { accused } = req.body;

    // Verify FIR exists and is registered by this officer
    const fir = await FIR.findOne({
      _id: firId,
      registeredBy: policeId,
    });

    if (!fir) {
      return res.status(404).json({
        success: false,
        message: "FIR not found or not registered by you",
      });
    }

    // Process accused information
    let accusedData = [];
    if (accused) {
      try {
        const accusedArray = Array.isArray(accused) ? accused : [accused];
        accusedData = accusedArray.map((acc) => ({
          ...acc,
          addedBy: "POLICE",
          addedById: policeId,
        }));
      } catch (error) {
        console.error("Error parsing accused data:", error);
        return res.status(400).json({
          success: false,
          message: "Invalid accused data format",
        });
      }
    }

    // Update FIR with new accused information
    fir.accused = accusedData;
    await fir.save();

    // Populate the response
    await fir.populate("registeredBy", "name pid rank station");
    await fir.populate("submittedToJudge", "name courtName");
    await fir.populate("complaintId", "title description area");

    res.json({
      success: true,
      message: "Accused information updated successfully",
      data: fir,
    });
  } catch (error) {
    console.error("Update FIR accused error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update accused information",
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
      const { firNumber, sections, judgeId, accused } = req.body;

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

      // First, include all attachments from the original complaint
      if (complaint.attachments && complaint.attachments.length > 0) {
        attachments.push(...complaint.attachments);
      }

      // Then add new attachments from the FIR registration
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

      // Process accused information - combine complaint accused with police added accused
      let accusedData = [...(complaint.accused || [])];
      if (accused) {
        try {
          // Parse accused - handle both JSON string and array
          let parsedAccused = [];
          if (typeof accused === "string") {
            parsedAccused = JSON.parse(accused);
          } else if (Array.isArray(accused)) {
            parsedAccused = accused;
          } else {
            parsedAccused = [accused];
          }

          // Clean accused data - remove temporary _id fields and ensure proper structure
          const policeAccused = parsedAccused.map((acc) => {
            const cleanAcc = {
              name: acc.name || "",
              address: acc.address || "",
              phone: acc.phone || "",
              email: acc.email || "",
              nid: acc.nid || "",
              age: acc.age || undefined,
              gender: acc.gender || undefined,
              occupation: acc.occupation || "",
              relationshipToComplainant: acc.relationshipToComplainant || "",
              addedBy: "POLICE",
              addedById: policeId,
            };
            return cleanAcc;
          });
          accusedData = [...accusedData, ...policeAccused];
        } catch (error) {
          console.error("Error parsing accused data:", error);
          // Continue without police accused data if parsing fails
        }
      }

      // Create FIR
      const fir = new FIR({
        complaintId,
        firNumber,
        sections: (() => {
          try {
            if (typeof sections === "string") {
              return JSON.parse(sections);
            } else if (Array.isArray(sections)) {
              return sections;
            } else {
              return [sections];
            }
          } catch (error) {
            console.error("Error parsing sections:", error);
            return [sections]; // Fallback to single item array
          }
        })(),
        registeredBy: policeId,
        submittedToJudge: judgeId || null,
        accused: accusedData,
        attachments,
      });

      await fir.save();

      // Update complaint status
      complaint.status = "FIR_REGISTERED";
      await complaint.save();

      // Create notifications for FIR registration
      await NotificationService.notifyFIRRegistration(Notification, {
        firId: fir._id,
        firNumber: fir.firNumber,
        complaintId: complaint._id,
        complainantId: complaint.complainantId,
        registeredBy: policeId,
        assignedJudgeId: judgeId,
        excludeRecipients: [policeId], // Don't notify the registering officer
      });

      // Populate the response
      await fir.populate("registeredBy", "name pid rank station");
      await fir.populate("submittedToJudge", "name courtName");
      await fir.populate("complaintId", "title description area");

      // Emit blockchain event (fire-and-forget)
      emitFIRRegistered({
        complaintId: complaint._id,
        firId: fir._id,
        firNumber: fir.firNumber,
        sections: fir.sections,
      }).catch(() => {});

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

// =============== OC FUNCTIONALITY ===============

// Get pending complaints for OC (auto-allocated by area)
router.get("/oc/complaints", authenticateToken, async (req, res) => {
  try {
    const policeId = req.user.id;

    // Verify the user is an OC
    const police = await Police.findById(policeId);
    if (!police || !police.isOC) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only OCs can view area complaints.",
      });
    }

    // Get complaints from the OC's area that are pending assignment
    const complaints = await Complaint.find({
      area: police.station,
      status: "PENDING",
      assignedOfficerIds: { $size: 0 }, // No officers assigned yet
    })
      .populate("complainantId", "name nid phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    console.error("Get OC complaints error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get area complaints",
      error: error.message,
    });
  }
});

// Assign investigating officer to complaint (OC only)
router.post(
  "/oc/complaints/:complaintId/assign",
  authenticateToken,
  async (req, res) => {
    try {
      const { complaintId } = req.params;
      const { officerId } = req.body;
      const ocId = req.user.id;

      // Verify the user is an OC
      const oc = await Police.findById(ocId);
      if (!oc || !oc.isOC) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only OCs can assign officers.",
        });
      }

      // Verify the complaint exists and is in OC's area
      const complaint = await Complaint.findOne({
        _id: complaintId,
        area: oc.station,
        status: "PENDING",
      });

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found or not in your jurisdiction",
        });
      }

      // Verify the officer exists and is from the same station
      const officer = await Police.findOne({
        _id: officerId,
        station: oc.station,
      });

      if (!officer) {
        return res.status(404).json({
          success: false,
          message: "Officer not found or not from your station",
        });
      }

      // Assign officer to complaint
      complaint.assignedOfficerIds.push(officerId);
      complaint.status = "UNDER_INVESTIGATION";
      await complaint.save();

      // Create notifications for assignment
      await NotificationService.notifyComplaintSubmission(Notification, {
        complaintId: complaint._id,
        title: complaint.title,
        complainantId: complaint.complainantId,
        assignedOfficerId: officerId,
        excludeRecipients: [],
      });

      // Populate the response
      await complaint.populate("complainantId", "name nid phone");
      await complaint.populate("assignedOfficerIds", "name rank station");

      res.json({
        success: true,
        message: "Officer assigned successfully",
        data: complaint,
      });
    } catch (error) {
      console.error("Assign officer error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to assign officer",
        error: error.message,
      });
    }
  }
);

// Get all officers in OC's station
router.get("/oc/officers", authenticateToken, async (req, res) => {
  try {
    const ocId = req.user.id;

    // Verify the user is an OC
    const oc = await Police.findById(ocId);
    if (!oc || !oc.isOC) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only OCs can view station officers.",
      });
    }

    // Get all officers from the same station (excluding OCs)
    const officers = await Police.find({
      station: oc.station,
      isOC: false,
    }).select("name rank pid");

    res.json({
      success: true,
      data: officers,
    });
  } catch (error) {
    console.error("Get station officers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get station officers",
      error: error.message,
    });
  }
});

// Get cases from OC's jurisdiction (OC only)
router.get("/oc/cases", authenticateToken, async (req, res) => {
  try {
    const ocId = req.user.id;

    // Verify the user is an OC
    const oc = await Police.findById(ocId);
    if (!oc || !oc.isOC) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only OCs can view jurisdiction cases.",
      });
    }

    // Get all cases where the investigating officers are from OC's station
    // This includes cases that originated from complaints assigned by this OC
    const stationOfficers = await Police.find({
      station: oc.station,
      isOC: false,
    }).select("_id");

    const officerIds = stationOfficers.map((officer) => officer._id);

    const cases = await Case.find({
      investigatingOfficerIds: { $in: officerIds },
    })
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
    console.error("Get OC cases error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get jurisdiction cases",
      error: error.message,
    });
  }
});

// =============== INVESTIGATION MANAGEMENT ===============

// Submit additional evidence for complaint
router.post(
  "/complaints/:complaintId/evidence",
  authenticateToken,
  upload.array("evidence", 5),
  async (req, res) => {
    try {
      const { complaintId } = req.params;
      const policeId = req.user.id;
      const { description } = req.body;

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

      // Process evidence uploads
      const evidenceFiles = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const uploadResult = await uploadToIPFS(
            file.buffer,
            file.originalname
          );
          if (uploadResult.success) {
            evidenceFiles.push({
              fileName: file.originalname,
              ipfsHash: uploadResult.ipfsHash,
              fileSize: file.size,
              description: description || "",
              uploadedBy: policeId,
              uploadedAt: new Date(),
            });
          } else {
            console.error("Failed to upload file to IPFS:", uploadResult.error);
          }
        }
      }

      // Add evidence to complaint attachments
      complaint.attachments.push(...evidenceFiles);
      await complaint.save();

      // Append proceeding if FIR and case exist: EVIDENCE_SUBMITTED
      const fir = await FIR.findOne({ complaintId: complaint._id });
      if (fir) {
        const caseData = await Case.findOne({ firId: fir._id });
        if (caseData) {
          await appendCaseProceeding(CaseProceeding, {
            caseId: caseData._id,
            type: "EVIDENCE_SUBMITTED",
            createdByRole: "POLICE",
            createdById: policeId,
            description: description || "Evidence submitted on complaint",
            attachments: evidenceFiles.map((e) => ({
              fileName: e.fileName,
              ipfsHash: e.ipfsHash,
              fileSize: e.fileSize,
            })),
            metadata: { complaintId: complaint._id },
          });

          // Emit chain event (non-blocking)
          emitCaseUpdated({
            caseId: caseData._id,
            updateType: "EVIDENCE_SUBMITTED",
            description: description || "Evidence submitted on complaint",
          }).catch(() => {});
        }
      }

      // Populate the response
      await complaint.populate("complainantId", "name nid phone");
      await complaint.populate("assignedOfficerIds", "name rank station");

      res.json({
        success: true,
        message: "Evidence submitted successfully",
        data: {
          complaintId,
          evidenceFiles,
        },
      });
    } catch (error) {
      console.error("Submit evidence error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit evidence",
        error: error.message,
      });
    }
  }
);

// Get my assigned cases (for investigating officers)
router.get("/cases", authenticateToken, async (req, res) => {
  try {
    const policeId = req.user.id;

    const cases = await Case.find({
      investigatingOfficerIds: policeId,
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
    console.error("Get police cases error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cases",
      error: error.message,
    });
  }
});

// Submit additional evidence for case
router.post(
  "/cases/:caseId/evidence",
  authenticateToken,
  upload.array("evidence", 5),
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const policeId = req.user.id;
      const { description } = req.body;

      // Verify case exists and officer is assigned
      const caseData = await Case.findOne({
        _id: caseId,
        investigatingOfficerIds: policeId,
      });

      if (!caseData) {
        return res.status(404).json({
          success: false,
          message: "Case not found or not assigned to you",
        });
      }

      // Process evidence uploads
      const evidenceFiles = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const uploadResult = await uploadToIPFS(
            file.buffer,
            file.originalname
          );
          if (uploadResult.success) {
            evidenceFiles.push({
              fileName: file.originalname,
              ipfsHash: uploadResult.ipfsHash,
              fileSize: file.size,
              description: description || "",
              uploadedBy: policeId,
              uploadedAt: new Date(),
            });
          } else {
            console.error("Failed to upload file to IPFS:", uploadResult.error);
          }
        }
      }

      // Append proceeding: EVIDENCE_SUBMITTED
      await appendCaseProceeding(CaseProceeding, {
        caseId: caseData._id,
        type: "EVIDENCE_SUBMITTED",
        createdByRole: "POLICE",
        createdById: policeId,
        description: description || "Evidence submitted",
        attachments: evidenceFiles.map((e) => ({
          fileName: e.fileName,
          ipfsHash: e.ipfsHash,
          fileSize: e.fileSize,
        })),
      });

      // Notify all parties about evidence submission
      const { notifyCaseParties } = await import("../utils/notifications.js");
      await notifyCaseParties(Notification, {
        caseId: caseData._id,
        title: "Evidence Submitted",
        message: `New evidence has been submitted for case ${caseData.caseNumber}`,
        recipientTypes: ["JUDGE", "LAWYER"],
      });

      // Emit chain event (non-blocking)
      emitCaseUpdated({
        caseId: caseData._id,
        updateType: "EVIDENCE_SUBMITTED",
        description: description || "Evidence submitted",
      }).catch(() => {});

      res.json({
        success: true,
        message: "Evidence submitted successfully",
        data: {
          caseId,
          evidenceFiles,
        },
      });
    } catch (error) {
      console.error("Submit case evidence error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit evidence",
        error: error.message,
      });
    }
  }
);

// Submit documents for case (police)
router.post(
  "/cases/:caseId/documents",
  authenticateToken,
  upload.array("documents", 5),
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const policeId = req.user.id;
      const { documentType, description } = req.body;

      // Verify case exists and officer is assigned
      const caseData = await Case.findOne({
        _id: caseId,
        investigatingOfficerIds: policeId,
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
              uploadedBy: policeId,
              uploadedAt: new Date(),
            });
          } else {
            console.error("Failed to upload file to IPFS:", uploadResult.error);
          }
        }
      }

      // Append proceeding: DOCUMENT_FILED
      await appendCaseProceeding(CaseProceeding, {
        caseId: caseData._id,
        type: "DOCUMENT_FILED",
        createdByRole: "POLICE",
        createdById: policeId,
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
        title: "Document Submitted",
        message: `New document has been submitted for case ${caseData.caseNumber}`,
        recipientTypes: ["JUDGE", "LAWYER"],
      });

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

// =============== NOTIFICATIONS ===============

// Get my notifications
router.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const policeId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = {
      recipientId: policeId,
      recipientType: "POLICE",
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
      const policeId = req.user.id;

      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipientId: policeId,
          recipientType: "POLICE",
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
    const policeId = req.user.id;

    const result = await Notification.updateMany(
      {
        recipientId: policeId,
        recipientType: "POLICE",
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
