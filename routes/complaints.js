import express from "express";
import multer from "multer";
import { Complaint, Citizen, Police, Case, FIR } from "../models/index.js";
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

// Get all complaints by citizen
router.get("/citizen/:citizenId", async (req, res) => {
  try {
    const { citizenId } = req.params;

    const complaints = await Complaint.find({ complainantId: citizenId })
      .populate("assignedOCId", "name rank station")
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

// Get cases involving a citizen
router.get("/citizen/:citizenId/cases", async (req, res) => {
  try {
    const { citizenId } = req.params;

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

// File new complaint with attachments
router.post("/file", upload.array("attachments", 5), async (req, res) => {
  try {
    const { complainantId, title, description, location, area } = req.body;

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
        const uploadResult = await uploadToIPFS(file.buffer, file.originalname);
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

    // Auto-assign to OC of the area (simplified logic - assumes OC exists for the area)
    const oc = await Police.findOne({
      isOC: true,
      station: { $regex: area, $options: "i" },
    });

    if (oc) {
      complaint.assignedOCId = oc._id;
      complaint.status = "ASSIGNED_TO_OC";
      await complaint.save();
    }

    // Populate the response
    await complaint.populate("complainantId", "name nid");
    await complaint.populate("assignedOCId", "name rank station");

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
});

// Get complaint details
router.get("/:complaintId", async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId)
      .populate("complainantId", "name nid phone email")
      .populate("assignedOCId", "name rank station")
      .populate("assignedOfficerIds", "name rank station");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
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
