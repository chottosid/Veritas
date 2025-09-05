import { ethers } from "ethers";
import { BlockchainTransaction } from "../models/index.js";
import { updateTransactionStatus } from "./blockchainTransactions.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

let provider = null;
const TEST_MODE = String(process.env.BLOCKCHAIN_TEST_MODE).toLowerCase() === "true" || 
                  String(process.env.NODE_ENV).toLowerCase() === "test" ||
                  !process.env.BLOCKCHAIN_TEST_MODE; // Treat undefined as test mode

function initProvider() {
  try {
    if (TEST_MODE) {
      provider = null;
      return;
    }
    if (!process.env.CELO_SEPOLIA_RPC_URL) return;
    provider = new ethers.JsonRpcProvider(process.env.CELO_SEPOLIA_RPC_URL);
  } catch (e) {
    provider = null;
  }
}

initProvider();

// Check and confirm a single transaction
export async function confirmTransaction(transactionHash) {
  try {
    if (TEST_MODE) {
      // In test mode, simulate confirmation after a short delay
      console.log(`[TEST MODE] Simulating confirmation for transaction: ${transactionHash}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await updateTransactionStatus(transactionHash, "CONFIRMED", {
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        gasUsed: "21000",
        gasPrice: "20000000000"
      });
      
      return result;
    }

    if (!provider) {
      return { ok: false, error: "Provider not initialized" };
    }

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(transactionHash);
    
    if (!receipt) {
      return { ok: false, error: "Transaction not found or not mined yet" };
    }

    if (receipt.status === 1) {
      // Transaction successful
      const result = await updateTransactionStatus(transactionHash, "CONFIRMED", {
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.gasPrice?.toString() || "0"
      });
      
      return result;
    } else {
      // Transaction failed
      const result = await updateTransactionStatus(transactionHash, "FAILED", {
        error: "Transaction reverted"
      });
      
      return result;
    }
  } catch (error) {
    console.error(`Error confirming transaction ${transactionHash}:`, error);
    return { ok: false, error: error.message };
  }
}

// Check and confirm all pending transactions
export async function confirmAllPendingTransactions() {
  try {
    console.log("Starting confirmation of pending transactions...");
    
    // Get all pending transactions
    const pendingTransactions = await BlockchainTransaction.find({ 
      status: "PENDING" 
    }).sort({ createdAt: 1 }); // Process oldest first

    console.log(`Found ${pendingTransactions.length} pending transactions`);

    const results = [];
    
    for (const tx of pendingTransactions) {
      console.log(`Checking transaction: ${tx.transactionHash}`);
      const result = await confirmTransaction(tx.transactionHash);
      results.push({
        transactionHash: tx.transactionHash,
        eventType: tx.eventType,
        result
      });
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const confirmed = results.filter(r => r.result.ok && r.result.transaction?.status === "CONFIRMED").length;
    const failed = results.filter(r => r.result.ok && r.result.transaction?.status === "FAILED").length;
    const stillPending = results.filter(r => !r.result.ok || r.result.transaction?.status === "PENDING").length;

    console.log(`Confirmation complete: ${confirmed} confirmed, ${failed} failed, ${stillPending} still pending`);

    return {
      ok: true,
      data: {
        total: pendingTransactions.length,
        confirmed,
        failed,
        stillPending,
        results
      }
    };
  } catch (error) {
    console.error("Error confirming pending transactions:", error);
    return { ok: false, error: error.message };
  }
}

// Get transaction status from blockchain
export async function getTransactionStatus(transactionHash) {
  try {
    if (TEST_MODE) {
      return {
        ok: true,
        data: {
          hash: transactionHash,
          status: "CONFIRMED",
          blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
          gasUsed: "21000",
          gasPrice: "20000000000",
          testMode: true
        }
      };
    }

    if (!provider) {
      return { ok: false, error: "Provider not initialized" };
    }

    const receipt = await provider.getTransactionReceipt(transactionHash);
    
    if (!receipt) {
      return {
        ok: true,
        data: {
          hash: transactionHash,
          status: "PENDING",
          blockNumber: null,
          gasUsed: null,
          gasPrice: null
        }
      };
    }

    return {
      ok: true,
      data: {
        hash: transactionHash,
        status: receipt.status === 1 ? "CONFIRMED" : "FAILED",
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.gasPrice?.toString() || "0"
      }
    };
  } catch (error) {
    console.error(`Error getting transaction status for ${transactionHash}:`, error);
    return { ok: false, error: error.message };
  }
}

// Check if blockchain is ready for confirmation
export function isConfirmationReady() {
  return Boolean(provider) && !TEST_MODE;
}
