import { BlockchainTransaction } from "../models/index.js";
import { getTransactionStatus } from "./blockchainConfirmation.js";
import { updateTransactionStatus } from "./blockchainTransactions.js";

// Validate and update transaction statuses against blockchain
export async function validateRecentTransactions(limit = 10) {
  try {
    console.log(`Validating ${limit} most recent transactions against blockchain...`);
    
    // Get recent pending transactions from database
    const pendingTransactions = await BlockchainTransaction.find({ 
      status: "PENDING" 
    })
    .sort({ createdAt: -1 })
    .limit(limit);

    console.log(`Found ${pendingTransactions.length} pending transactions to validate`);

    const results = [];
    
    for (const tx of pendingTransactions) {
      console.log(`Validating transaction: ${tx.transactionHash}`);
      
      try {
        // Check transaction status on blockchain
        const blockchainStatus = await getTransactionStatus(tx.transactionHash);
        
        if (blockchainStatus.ok) {
          const { status, blockNumber, gasUsed, gasPrice } = blockchainStatus.data;
          
          if (status === "CONFIRMED") {
            // Update database to reflect confirmed status
            const updateResult = await updateTransactionStatus(tx.transactionHash, "CONFIRMED", {
              blockNumber,
              gasUsed,
              gasPrice,
            });
            
            results.push({
              transactionHash: tx.transactionHash,
              eventType: tx.eventType,
              oldStatus: "PENDING",
              newStatus: "CONFIRMED",
              blockNumber,
              gasUsed,
              success: updateResult.ok
            });
            
            console.log(`✅ Updated ${tx.transactionHash} to CONFIRMED (Block ${blockNumber})`);
          } else if (status === "FAILED") {
            // Update database to reflect failed status
            const updateResult = await updateTransactionStatus(tx.transactionHash, "FAILED", {
              error: "Transaction failed on blockchain"
            });
            
            results.push({
              transactionHash: tx.transactionHash,
              eventType: tx.eventType,
              oldStatus: "PENDING",
              newStatus: "FAILED",
              success: updateResult.ok
            });
            
            console.log(`❌ Updated ${tx.transactionHash} to FAILED`);
          } else {
            // Still pending on blockchain
            results.push({
              transactionHash: tx.transactionHash,
              eventType: tx.eventType,
              oldStatus: "PENDING",
              newStatus: "PENDING",
              reason: "Still pending on blockchain"
            });
            
            console.log(`⏳ ${tx.transactionHash} still pending on blockchain`);
          }
        } else {
          // Transaction not found on blockchain
          results.push({
            transactionHash: tx.transactionHash,
            eventType: tx.eventType,
            oldStatus: "PENDING",
            newStatus: "PENDING",
            reason: "Not found on blockchain",
            error: blockchainStatus.error
          });
          
          console.log(`❓ ${tx.transactionHash} not found on blockchain: ${blockchainStatus.error}`);
        }
      } catch (error) {
        console.error(`Error validating ${tx.transactionHash}:`, error.message);
        results.push({
          transactionHash: tx.transactionHash,
          eventType: tx.eventType,
          oldStatus: "PENDING",
          newStatus: "PENDING",
          error: error.message
        });
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const confirmed = results.filter(r => r.newStatus === "CONFIRMED").length;
    const failed = results.filter(r => r.newStatus === "FAILED").length;
    const stillPending = results.filter(r => r.newStatus === "PENDING").length;

    console.log(`Validation complete: ${confirmed} confirmed, ${failed} failed, ${stillPending} still pending`);

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
    console.error("Error validating recent transactions:", error);
    return { ok: false, error: error.message };
  }
}

// Validate all pending transactions (use with caution for large datasets)
export async function validateAllPendingTransactions() {
  try {
    const totalPending = await BlockchainTransaction.countDocuments({ status: "PENDING" });
    console.log(`Found ${totalPending} total pending transactions`);
    
    if (totalPending > 100) {
      console.log("Too many pending transactions, validating in batches of 50");
      return await validateRecentTransactions(50);
    } else {
      return await validateRecentTransactions(totalPending);
    }
  } catch (error) {
    console.error("Error validating all pending transactions:", error);
    return { ok: false, error: error.message };
  }
}

// Get transaction status with blockchain validation
export async function getTransactionStatusWithValidation(transactionHash) {
  try {
    // First check database
    const dbTransaction = await BlockchainTransaction.findOne({ transactionHash });
    
    // Then check blockchain
    const blockchainStatus = await getTransactionStatus(transactionHash);
    
    return {
      ok: true,
      data: {
        transactionHash,
        database: dbTransaction ? {
          status: dbTransaction.status,
          eventType: dbTransaction.eventType,
          createdAt: dbTransaction.createdAt,
          blockNumber: dbTransaction.blockNumber,
          gasUsed: dbTransaction.gasUsed
        } : null,
        blockchain: blockchainStatus.ok ? blockchainStatus.data : null,
        isConsistent: dbTransaction && blockchainStatus.ok ? 
          dbTransaction.status === blockchainStatus.data.status : false
      }
    };
  } catch (error) {
    console.error("Error getting transaction status with validation:", error);
    return { ok: false, error: error.message };
  }
}

