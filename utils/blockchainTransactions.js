import { BlockchainTransaction } from "../models/index.js";

// Track a new blockchain transaction
export const trackTransaction = async ({
  transactionHash,
  eventType,
  caseId = null,
  complaintId = null,
  firId = null,
  evidenceId = null,
  metadata = null,
}) => {
  try {
    const transaction = new BlockchainTransaction({
      transactionHash,
      eventType,
      caseId,
      complaintId,
      firId,
      evidenceId,
      metadata,
      status: "PENDING",
    });

    await transaction.save();
    return { ok: true, transaction };
  } catch (error) {
    console.error("Failed to track transaction:", error);
    return { ok: false, error: error.message };
  }
};

// Update transaction status
export const updateTransactionStatus = async (
  transactionHash,
  status,
  additionalData = {}
) => {
  try {
    const updateData = { status, ...additionalData };

    if (status === "CONFIRMED") {
      updateData.confirmedAt = new Date();
    }

    const transaction = await BlockchainTransaction.findOneAndUpdate(
      { transactionHash },
      updateData,
      { new: true }
    );

    return { ok: true, transaction };
  } catch (error) {
    console.error("Failed to update transaction status:", error);
    return { ok: false, error: error.message };
  }
};

// Get recent transactions for blockchain explorer
export const getRecentTransactions = async (
  limit = 20,
  page = 1,
  eventType = null
) => {
  try {
    const query = {};
    if (eventType) {
      query.eventType = eventType;
    }

    const skip = (page - 1) * limit;

    const transactions = await BlockchainTransaction.find(query)
      .populate("caseId", "caseNumber")
      .populate("complaintId", "title")
      .populate("firId", "firNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BlockchainTransaction.countDocuments(query);

    return {
      ok: true,
      data: {
        transactions: transactions.map((tx) => ({
          hash: tx.transactionHash,
          type: tx.eventType,
          caseNumber:
            tx.caseId?.caseNumber ||
            tx.complaintId?.title ||
            tx.firId?.firNumber ||
            "N/A",
          timestamp: tx.createdAt.toISOString(),
          blockNumber: tx.blockNumber || 0,
          gasUsed: tx.gasUsed || "0",
          status: tx.status,
          metadata: tx.metadata,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Failed to get recent transactions:", error);
    return { ok: false, error: error.message };
  }
};

// Get transaction by hash
export const getTransactionByHash = async (transactionHash) => {
  try {
    const transaction = await BlockchainTransaction.findOne({ transactionHash })
      .populate("caseId", "caseNumber")
      .populate("complaintId", "title")
      .populate("firId", "firNumber");

    if (!transaction) {
      return { ok: false, error: "Transaction not found" };
    }

    return { ok: true, transaction };
  } catch (error) {
    console.error("Failed to get transaction:", error);
    return { ok: false, error: error.message };
  }
};

// Get transactions for a specific case
export const getCaseTransactions = async (caseId) => {
  try {
    const transactions = await BlockchainTransaction.find({ caseId }).sort({
      createdAt: -1,
    });

    return { ok: true, transactions };
  } catch (error) {
    console.error("Failed to get case transactions:", error);
    return { ok: false, error: error.message };
  }
};

// Get blockchain statistics
export const getBlockchainStats = async () => {
  try {
    const [
      totalTransactions,
      confirmedTransactions,
      pendingTransactions,
      failedTransactions,
      recentTransactions,
    ] = await Promise.all([
      BlockchainTransaction.countDocuments(),
      BlockchainTransaction.countDocuments({ status: "CONFIRMED" }),
      BlockchainTransaction.countDocuments({ status: "PENDING" }),
      BlockchainTransaction.countDocuments({ status: "FAILED" }),
      BlockchainTransaction.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      }),
    ]);

    return {
      ok: true,
      data: {
        totalTransactions,
        confirmedTransactions,
        pendingTransactions,
        failedTransactions,
        recentTransactions,
        successRate:
          totalTransactions > 0
            ? (confirmedTransactions / totalTransactions) * 100
            : 0,
      },
    };
  } catch (error) {
    console.error("Failed to get blockchain stats:", error);
    return { ok: false, error: error.message };
  }
};

