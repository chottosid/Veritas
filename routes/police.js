import express from "express";
import { Police, Complaint } from "../models/index.js";

const router = express.Router();

// Get all complaints assigned to an OC
router.get("/oc/:ocId/complaints", async (req, res) => {
  try {
    const { ocId } = req.params;

    // Verify OC exists
    const oc = await Police.findById(ocId);
    if (!oc || !oc.isOC) {
      return res.status(404).json({
        success: false,
        message: "Officer in Charge not found",
      });
    }

    const complaints = await Complaint.find({ assignedOCId: ocId })
      .populate("complainantId", "name nid phone")
      .populate("assignedOfficerIds", "name rank station")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    console.error("Get OC complaints error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get complaints",
      error: error.message,
    });
  }
});

// Assign officers to investigate a complaint (OC action)
router.post("/complaints/:complaintId/assign-officers", async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { ocId, officerIds } = req.body;

    // Verify OC exists and is assigned to this complaint
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (complaint.assignedOCId.toString() !== ocId) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned OC can assign officers to this complaint",
      });
    }

    // Verify all officers exist and belong to the same station as OC
    const oc = await Police.findById(ocId);
    const officers = await Police.find({
      _id: { $in: officerIds },
      station: oc.station,
    });

    if (officers.length !== officerIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some officers not found or not in the same station",
      });
    }

    // Assign officers to complaint
    complaint.assignedOfficerIds = officerIds;
    complaint.status = "UNDER_INVESTIGATION";
    await complaint.save();

    await complaint.populate("assignedOfficerIds", "name rank station");

    res.json({
      success: true,
      message: "Officers assigned successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("Assign officers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign officers",
      error: error.message,
    });
  }
});

// Get all officers in a station (for OC to choose from)
router.get("/station/:station/officers", async (req, res) => {
  try {
    const { station } = req.params;

    const officers = await Police.find({
      station: { $regex: station, $options: "i" },
      isOC: false, // Exclude OCs from the list
    }).select("name rank pid");

    res.json({
      success: true,
      data: officers,
    });
  } catch (error) {
    console.error("Get station officers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get officers",
      error: error.message,
    });
  }
});

// Get complaints assigned to an officer
router.get("/officer/:officerId/complaints", async (req, res) => {
  try {
    const { officerId } = req.params;

    const complaints = await Complaint.find({
      assignedOfficerIds: officerId,
    })
      .populate("complainantId", "name nid phone")
      .populate("assignedOCId", "name rank station")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    console.error("Get officer complaints error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get complaints",
      error: error.message,
    });
  }
});

export default router;
