import { BlockchainTransaction } from "../models/index.js";
import { getTransactionStatus } from "./blockchainConfirmation.js";
import { updateTransactionStatus } from "./blockchainTransactions.js";

// Check if we're in test mode
const TEST_MODE = String(process.env.BLOCKCHAIN_TEST_MODE).toLowerCase() === "true" || 
                  String(process.env.NODE_ENV).toLowerCase() === "test" ||
                  !process.env.BLOCKCHAIN_TEST_MODE; // Treat undefined as test mode

// Background job to sync pending transactions with blockchain
export class BlockchainSyncJob {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.intervalMs = 30000; // 30 seconds default
    this.batchSize = 10; // Process 10 transactions at a time
    this.maxRetries = 3; // Max retries for failed validations
  }

  // Start the background sync job
  start(intervalMs = 30000) {
    if (this.isRunning) {
      console.log("Blockchain sync job is already running");
      return;
    }

    this.intervalMs = intervalMs;
    this.isRunning = true;
    
    console.log(`Starting blockchain sync job (interval: ${intervalMs}ms)`);
    
    // Run immediately, then on interval
    this.syncPendingTransactions();
    this.intervalId = setInterval(() => {
      this.syncPendingTransactions();
    }, this.intervalMs);
  }

  // Stop the background sync job
  stop() {
    if (!this.isRunning) {
      console.log("Blockchain sync job is not running");
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log("Blockchain sync job stopped");
  }

  // Get job status
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      batchSize: this.batchSize,
      maxRetries: this.maxRetries
    };
  }

  // Main sync function
  async syncPendingTransactions() {
    if (!this.isRunning) return;

    try {
      console.log("🔄 Starting blockchain sync...");
      
      // Get pending transactions that haven't been retried too many times
      const pendingTransactions = await BlockchainTransaction.find({
        status: "PENDING",
        $or: [
          { retryCount: { $exists: false } },
          { retryCount: { $lt: this.maxRetries } }
        ]
      })
      .sort({ createdAt: 1 }) // Process oldest first
      .limit(this.batchSize);

      if (pendingTransactions.length === 0) {
        console.log("✅ No pending transactions to sync");
        return;
      }

      console.log(`📋 Found ${pendingTransactions.length} pending transactions to validate`);
      console.log(`🧪 TEST_MODE: ${TEST_MODE}`);

      const results = {
        processed: 0,
        confirmed: 0,
        failed: 0,
        stillPending: 0,
        errors: 0
      };

      for (const tx of pendingTransactions) {
        try {
          results.processed++;
          console.log(`🔍 Validating ${tx.transactionHash} (${tx.eventType})`);
          
          // In TEST_MODE, automatically confirm all transactions
          if (TEST_MODE) {
            console.log(`🧪 TEST_MODE: Auto-confirming transaction ${tx.transactionHash}`);
            await updateTransactionStatus(tx.transactionHash, "CONFIRMED", {
              blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
              gasUsed: "21000",
              gasPrice: "20000000000",
              syncedAt: new Date(),
              testMode: true
            });
            
            results.confirmed++;
            console.log(`✅ TEST_MODE: Confirmed ${tx.transactionHash}`);
            continue;
          }
          
          // Check transaction status on blockchain
          const blockchainStatus = await getTransactionStatus(tx.transactionHash);
          
          if (blockchainStatus.ok) {
            const { status, blockNumber, gasUsed, gasPrice } = blockchainStatus.data;
            
            if (status === "CONFIRMED") {
              // Update database to reflect confirmed status
              await updateTransactionStatus(tx.transactionHash, "CONFIRMED", {
                blockNumber,
                gasUsed,
                gasPrice,
                syncedAt: new Date()
              });
              
              results.confirmed++;
              console.log(`✅ Confirmed ${tx.transactionHash} (Block ${blockNumber})`);
              
            } else if (status === "FAILED") {
              // Update database to reflect failed status
              await updateTransactionStatus(tx.transactionHash, "FAILED", {
                error: "Transaction failed on blockchain",
                syncedAt: new Date()
              });
              
              results.failed++;
              console.log(`❌ Failed ${tx.transactionHash}`);
              
            } else {
              // Still pending on blockchain - increment retry count
              await BlockchainTransaction.findOneAndUpdate(
                { _id: tx._id },
                { 
                  $inc: { retryCount: 1 },
                  lastRetryAt: new Date()
                }
              );
              
              results.stillPending++;
              console.log(`⏳ Still pending ${tx.transactionHash} (retry ${(tx.retryCount || 0) + 1})`);
            }
          } else {
            // Transaction not found or error - increment retry count
            await BlockchainTransaction.findOneAndUpdate(
              { _id: tx._id },
              { 
                $inc: { retryCount: 1 },
                lastRetryAt: new Date(),
                lastError: blockchainStatus.error
              }
            );
            
            results.stillPending++;
            console.log(`❓ ${tx.transactionHash} not found on blockchain: ${blockchainStatus.error}`);
          }
        } catch (error) {
          results.errors++;
          console.error(`❌ Error validating ${tx.transactionHash}:`, error.message);
          
          // Increment retry count for errors
          await BlockchainTransaction.findOneAndUpdate(
            { _id: tx._id },
            { 
              $inc: { retryCount: 1 },
              lastRetryAt: new Date(),
              lastError: error.message
            }
          );
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`🎯 Sync complete: ${results.confirmed} confirmed, ${results.failed} failed, ${results.stillPending} still pending, ${results.errors} errors`);
      
    } catch (error) {
      console.error("❌ Blockchain sync job error:", error);
    }
  }

  // Manual sync trigger
  async triggerSync() {
    console.log("🔄 Manual sync triggered...");
    console.log(`🧪 TEST_MODE: ${TEST_MODE}`);
    
    // Temporarily set isRunning to true for manual sync
    const wasRunning = this.isRunning;
    this.isRunning = true;
    
    try {
      await this.syncPendingTransactions();
    } finally {
      // Restore original running state
      this.isRunning = wasRunning;
    }
  }

  // Get sync statistics
  async getStats() {
    try {
      const [
        totalPending,
        totalConfirmed,
        totalFailed,
        pendingWithRetries,
        oldestPending
      ] = await Promise.all([
        BlockchainTransaction.countDocuments({ status: "PENDING" }),
        BlockchainTransaction.countDocuments({ status: "CONFIRMED" }),
        BlockchainTransaction.countDocuments({ status: "FAILED" }),
        BlockchainTransaction.countDocuments({ 
          status: "PENDING", 
          retryCount: { $gte: 1 } 
        }),
        BlockchainTransaction.findOne(
          { status: "PENDING" },
          { createdAt: 1 }
        ).sort({ createdAt: 1 })
      ]);

      return {
        totalPending,
        totalConfirmed,
        totalFailed,
        pendingWithRetries,
        oldestPending: oldestPending?.createdAt,
        jobStatus: this.getStatus()
      };
    } catch (error) {
      console.error("Error getting sync stats:", error);
      return { error: error.message };
    }
  }
}

// Create a singleton instance
export const blockchainSyncJob = new BlockchainSyncJob();
