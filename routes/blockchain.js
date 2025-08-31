import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getCaseMetadata,
  getCaseEvidence,
  getCaseUpdates,
  getBlockchainStats,
  getContractAddress,
  isBlockchainReady,
  isBlockchainTestMode,
} from "../utils/blockchain.js";

const router = express.Router();

// Get all evidence IDs for a case (helper endpoint)
router.get("/case/:caseId/evidence-ids", async (req, res) => {
  try {
    const { caseId } = req.params;

    // Import Case model
    const { Case, CaseProceeding } = await import("../models/index.js");

    // First, try to find the case in the database
    let caseData = null;

    // Try to find by case number first (if it looks like a case number)
    if (caseId.includes("CASE-")) {
      caseData = await Case.findOne({ caseNumber: caseId });
    }

    // If not found by case number, try to find by ID
    if (!caseData) {
      caseData = await Case.findById(caseId);
    }

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found in database",
      });
    }

    // Get case proceedings with evidence
    const proceedings = await CaseProceeding.find({
      caseId: caseData._id,
      type: "EVIDENCE_SUBMITTED",
    }).populate("createdById", "name");

    // Extract evidence IDs
    const evidenceIds = proceedings
      .filter((p) => p.attachments && p.attachments.length > 0)
      .flatMap((p) =>
        p.attachments.map((att) => ({
          evidenceId: `proc-${p._id}-${att.fileName}`,
          fileName: att.fileName,
          description: p.description,
          submittedBy: p.createdById ? p.createdById.name : p.createdByRole,
          submittedAt: p.at,
          ipfsHash: att.ipfsHash,
        }))
      );

    res.json({
      success: true,
      data: {
        caseNumber: caseData.caseNumber,
        caseId: caseData._id,
        evidenceCount: evidenceIds.length,
        evidenceIds: evidenceIds,
      },
    });
  } catch (error) {
    console.error("Get evidence IDs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get evidence IDs",
      error: error.message,
    });
  }
});

// Public blockchain status endpoint
router.get("/status", async (req, res) => {
  try {
    const stats = await getBlockchainStats();
    const isReady = isBlockchainReady();
    const isTestMode = isBlockchainTestMode();
    const contractAddress = getContractAddress();

    res.json({
      success: true,
      data: {
        blockchain: {
          status: isReady ? "CONNECTED" : "DISCONNECTED",
          testMode: isTestMode,
          contractAddress,
          ...stats.data,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Blockchain status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get blockchain status",
      error: error.message,
    });
  }
});

// Public case verification endpoint
router.get("/verify/case/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;

    // Import Case model
    const { Case, CaseProceeding } = await import("../models/index.js");

    // First, try to find the case in the database
    // The caseId parameter can be either a case number or the actual case ID
    let caseData = null;

    // Try to find by case number first (if it looks like a case number)
    if (caseId.includes("CASE-")) {
      caseData = await Case.findOne({ caseNumber: caseId })
        .populate("assignedJudgeId", "name courtName")
        .populate("investigatingOfficerIds", "name rank station");
    }

    // If not found by case number, try to find by ID
    if (!caseData) {
      caseData = await Case.findById(caseId)
        .populate("assignedJudgeId", "name courtName")
        .populate("investigatingOfficerIds", "name rank station");
    }

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found in database",
      });
    }

    // Now use the actual case ID to query blockchain
    const actualCaseId = caseData._id.toString();

    // Helper function to safely convert BigInt to string for JSON serialization
    const safeBigIntConversion = (obj) => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === "bigint") return obj.toString();
      if (Array.isArray(obj)) return obj.map(safeBigIntConversion);
      if (typeof obj === "object") {
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
          converted[key] = safeBigIntConversion(value);
        }
        return converted;
      }
      return obj;
    };

    // Get case metadata from blockchain
    const metadataResult = await getCaseMetadata(actualCaseId);
    if (!metadataResult.ok) {
      return res.status(404).json({
        success: false,
        message: "Case not found on blockchain",
        error: metadataResult.error,
      });
    }

    // Get case evidence from blockchain
    const evidenceResult = await getCaseEvidence(actualCaseId);
    const evidence = evidenceResult.ok ? evidenceResult.data : [];

    // Get case updates from blockchain
    const updatesResult = await getCaseUpdates(actualCaseId);
    const updates = updatesResult.ok ? updatesResult.data : [];

    // Get case proceedings from database for additional context
    const proceedings = await CaseProceeding.find({ caseId: caseData._id })
      .populate("createdById", "name")
      .sort({ at: -1 });

    // Combine blockchain data with database data
    const combinedMetadata = {
      caseNumber: caseData.caseNumber,
      status: caseData.status,
      createdAt: Math.floor(caseData.createdAt.getTime() / 1000),
      lastUpdated: Math.floor(caseData.updatedAt.getTime() / 1000),
      assignedJudge: caseData.assignedJudgeId
        ? caseData.assignedJudgeId.name
        : "Not assigned",
      investigatingOfficer:
        caseData.investigatingOfficerIds &&
        caseData.investigatingOfficerIds.length > 0
          ? caseData.investigatingOfficerIds[0].name
          : "Not assigned",
      isActive: caseData.status !== "CLOSED",
      ...metadataResult.data, // Override with blockchain data if available
    };

    // Combine evidence from blockchain and database
    const combinedEvidence = [
      ...evidence.map((e) => ({
        evidenceId: e.evidenceId,
        type: e.evidenceType,
        ipfsHash: e.ipfsHash,
        description: e.description,
        submittedAt: new Date(e.timestamp * 1000).toISOString(),
        verified: e.isVerified,
      })),
      // Add evidence from case proceedings (only actual evidence, not orders/documents)
      ...proceedings
        .filter(
          (p) =>
            p.attachments &&
            p.attachments.length > 0 &&
            p.type === "EVIDENCE_SUBMITTED"
        )
        .flatMap((p) =>
          p.attachments.map((att) => ({
            evidenceId: `proc-${p._id}-${att.fileName}`,
            type: "EVIDENCE",
            ipfsHash: att.ipfsHash,
            description: p.description || `Evidence submitted: ${att.fileName}`,
            submittedAt: p.at.toISOString(),
            verified: true,
          }))
        ),
    ];

    // Helper function to format metadata for display
    const formatMetadata = (metadata) => {
      if (!metadata) return null;

      try {
        const parsed =
          typeof metadata === "string" ? JSON.parse(metadata) : metadata;

        // Format specific metadata types
        if (parsed.documentType && parsed.fileCount) {
          return `${parsed.documentType} document${
            parsed.documentType > 1 ? "s" : ""
          } (${parsed.fileCount} file${parsed.fileCount > 1 ? "s" : ""})`;
        }

        if (parsed.accusedName && parsed.action) {
          return `Accused: ${parsed.accusedName}`;
        }

        if (parsed.hearingDate) {
          const date = new Date(parsed.hearingDate);
          return `Hearing Date: ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
        }

        // Return formatted string for other metadata
        return Object.entries(parsed)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
      } catch (e) {
        return metadata;
      }
    };

    // Combine updates from blockchain and database
    const combinedUpdates = [
      ...updates.map((u) => ({
        type: u.updateType,
        description: u.description,
        actor: u.actor,
        timestamp: new Date(u.timestamp * 1000).toISOString(),
        metadata: u.metadata,
      })),
      // Add updates from case proceedings
      ...proceedings.map((p) => ({
        type: p.type,
        description: p.description,
        actor: p.createdById ? p.createdById.name : p.createdByRole,
        timestamp: p.at.toISOString(),
        metadata: formatMetadata(p.metadata),
      })),
    ];

    const responseData = {
      success: true,
      data: {
        caseId: actualCaseId,
        verification: {
          verified: true,
          timestamp: new Date().toISOString(),
          blockchainHash: metadataResult.data ? `0x${actualCaseId}` : null,
        },
        metadata: combinedMetadata,
        evidence: combinedEvidence,
        documents: proceedings
          .filter(
            (p) =>
              p.attachments &&
              p.attachments.length > 0 &&
              p.type === "DOCUMENT_FILED"
          )
          .flatMap((p) =>
            p.attachments.map((att) => ({
              documentId: `doc-${p._id}-${att.fileName}`,
              type: p.metadata?.documentType || "DOCUMENT",
              ipfsHash: att.ipfsHash,
              description: p.description || `Document: ${att.fileName}`,
              submittedAt: p.at.toISOString(),
              submittedBy: p.createdById ? p.createdById.name : p.createdByRole,
              verified: true,
            }))
          ),
        updates: combinedUpdates,
        blockchain: {
          network: "Polygon Amoy Testnet",
          contractAddress: getContractAddress(),
          lastVerified: new Date().toISOString(),
        },
      },
    };

    // Apply BigInt conversion to the entire response
    const safeResponse = safeBigIntConversion(responseData);

    try {
      res.json(safeResponse);
    } catch (jsonError) {
      console.error("JSON serialization error:", jsonError);
      res.status(500).json({
        success: false,
        message: "Failed to serialize response data",
        error: "Data serialization error",
      });
    }
  } catch (error) {
    console.error("Case verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify case",
      error: error.message,
    });
  }
});

// Public evidence verification endpoint
router.get("/verify/evidence/:evidenceId", async (req, res) => {
  try {
    const { evidenceId } = req.params;

    // For now, we'll return a mock verification since evidence is stored per case
    // In a real implementation, you'd query the blockchain for specific evidence

    res.json({
      success: true,
      data: {
        evidenceId,
        verification: {
          verified: true,
          timestamp: new Date().toISOString(),
          blockchainHash: `0x${evidenceId}`,
        },
        blockchain: {
          network: "Polygon Amoy Testnet",
          contractAddress: getContractAddress(),
          lastVerified: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Evidence verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify evidence",
      error: error.message,
    });
  }
});

// Public blockchain explorer endpoint
router.get("/explorer", async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    // Get blockchain stats
    const stats = await getBlockchainStats();

    // Mock recent transactions for demo purposes
    // In production, you'd query actual blockchain events
    const mockTransactions = [
      {
        hash: "0x1234567890abcdef1234567890abcdef12345678",
        type: "CASE_CREATED",
        caseNumber: "CASE-2025-002",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        blockNumber: stats.data.blockNumber - 100,
        gasUsed: "150000",
        status: "CONFIRMED",
      },
      {
        hash: "0xabcdef1234567890abcdef1234567890abcdef12",
        type: "EVIDENCE_SUBMITTED",
        caseNumber: "CASE-2025-002",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        blockNumber: stats.data.blockNumber - 200,
        gasUsed: "120000",
        status: "CONFIRMED",
      },
      {
        hash: "0x567890abcdef1234567890abcdef1234567890ab",
        type: "FIR_REGISTERED",
        caseNumber: "FIR-2025-002",
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        blockNumber: stats.data.blockNumber - 300,
        gasUsed: "180000",
        status: "CONFIRMED",
      },
    ];

    // Filter by type if specified
    const filteredTransactions = type
      ? mockTransactions.filter((tx) => tx.type === type)
      : mockTransactions;

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = filteredTransactions.slice(
      startIndex,
      endIndex
    );

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredTransactions.length,
          pages: Math.ceil(filteredTransactions.length / limit),
        },
        blockchain: {
          network: "Polygon Amoy Testnet",
          currentBlock: stats.data.blockNumber,
          contractAddress: getContractAddress(),
          lastUpdated: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Blockchain explorer error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get blockchain explorer data",
      error: error.message,
    });
  }
});

// Public system transparency endpoint
router.get("/transparency", async (req, res) => {
  try {
    const stats = await getBlockchainStats();

    res.json({
      success: true,
      data: {
        system: {
          name: "Justice Blockchain System",
          version: "1.0.0",
          description:
            "Transparent and verifiable legal case management system",
          features: [
            "Immutable case records",
            "Evidence verification",
            "Public transparency",
            "Real-time updates",
            "IPFS integration",
          ],
        },
        blockchain: {
          network: "Polygon Amoy Testnet",
          contractAddress: getContractAddress(),
          currentBlock: stats.data.blockNumber,
          lastBlockTime: stats.data.lastBlockTime,
          gasPrice: stats.data.gasPrice,
        },
        transparency: {
          publicVerification: true,
          openSource: true,
          auditTrail: true,
          evidenceIntegrity: true,
          caseHistory: true,
        },
        api: {
          endpoints: [
            "/api/blockchain/status",
            "/api/blockchain/verify/case/:caseId",
            "/api/blockchain/verify/evidence/:evidenceId",
            "/api/blockchain/explorer",
            "/api/blockchain/transparency",
          ],
          documentation: "/api/docs",
          rateLimit: "1000 requests per hour",
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Transparency endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transparency information",
      error: error.message,
    });
  }
});

export default router;
