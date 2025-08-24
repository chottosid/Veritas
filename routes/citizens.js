import express from "express";
import { Citizen } from "../models/index.js";

const router = express.Router();

// Citizen Registration
router.post("/register", async (req, res) => {
  try {
    const { name, address, dateOfBirth, phone, email, nid } = req.body;

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

    // Create new citizen
    const citizen = new Citizen({
      name,
      address,
      dateOfBirth,
      phone,
      email,
      nid,
    });

    await citizen.save();

    res.status(201).json({
      success: true,
      message: "Citizen registered successfully",
      data: {
        id: citizen._id,
        name: citizen.name,
        nid: citizen.nid,
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

// Get citizen profile
router.get("/:citizenId", async (req, res) => {
  try {
    const { citizenId } = req.params;

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

export default router;
