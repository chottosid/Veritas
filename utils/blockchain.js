import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { ethers } from "ethers";
import { trackTransaction } from "./blockchainTransactions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

let provider = null;
let wallet = null;
let contract = null;
let abi = null;
let contractAddress = process.env.CONTRACT_ADDRESS || "";
const TEST_MODE =
  String(process.env.BLOCKCHAIN_TEST_MODE).toLowerCase() === "true" ||
  String(process.env.NODE_ENV).toLowerCase() === "test";

function loadAbi() {
  try {
    const abiPath = path.resolve(
      __dirname,
      "../blockchain/deployments/JusticeEvents.abi.json"
    );
    abi = JSON.parse(fs.readFileSync(abiPath, "utf-8"));
  } catch (e) {
    abi = null;
  }
}

function initContract() {
  try {
    if (TEST_MODE) {
      // Explicitly disable chain connections in test mode
      provider = null;
      wallet = null;
      contract = null;
      return;
    }
    if (!process.env.AMOY_RPC_URL || !process.env.PRIVATE_KEY) return;
    if (!abi) loadAbi();
    if (!abi) return;
    provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    if (!contractAddress) {
      // Try reading address persisted by deploy script
      try {
        const addrPath = path.resolve(
          __dirname,
          "../blockchain/deployments/JusticeEvents.address"
        );
        contractAddress = fs.readFileSync(addrPath, "utf-8").trim();
      } catch (_) {}
    }
    if (!contractAddress) return;
    contract = new ethers.Contract(contractAddress, abi, wallet);
  } catch (e) {
    provider = null;
    wallet = null;
    contract = null;
  }
}

initContract();

async function safeCall(promiseFactory, trackingData = null) {
  try {
    if (TEST_MODE) {
      // Return a deterministic-looking mock hash to satisfy clients
      const mockHash = ethers.id(
        `TEST:${Date.now()}:${Math.random().toString(36).slice(2)}`
      );

      // Track the mock transaction if tracking data is provided
      if (trackingData) {
        await trackTransaction({
          transactionHash: mockHash,
          ...trackingData,
        });
      }

      return { ok: true, skipped: true, hash: mockHash };
    }
    if (!contract) return { ok: false, skipped: true };
    const tx = await promiseFactory();

    // Track the real transaction if tracking data is provided
    if (trackingData) {
      await trackTransaction({
        transactionHash: tx.hash,
        ...trackingData,
      });
    }

    // Don't await confirmations to avoid slowing API; still wait for hash
    return { ok: true, hash: tx.hash };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

// Enhanced blockchain functions
export async function emitComplaintFiled({
  complaintId,
  actor,
  title,
  area,
  ipfsSummary = "",
  complainantName = "",
}) {
  return safeCall(
    () =>
      contract.emitComplaintFiled(
        ethers.id(complaintId.toString()),
        title || "",
        area || "",
        ipfsSummary || "",
        complainantName || ""
      ),
    {
      eventType: "COMPLAINT_FILED",
      complaintId,
      metadata: { title, area, complainantName },
    }
  );
}

export async function emitFIRRegistered({
  complaintId,
  firId,
  firNumber,
  sections,
  investigatingOfficer = "",
}) {
  return safeCall(
    () =>
      contract.emitFIRRegistered(
        ethers.id(complaintId.toString()),
        ethers.id(firId.toString()),
        String(firNumber || ""),
        Array.isArray(sections) ? sections.join(",") : String(sections || ""),
        investigatingOfficer || ""
      ),
    {
      eventType: "FIR_REGISTERED",
      complaintId,
      firId,
      metadata: { firNumber, sections, investigatingOfficer },
    }
  );
}

export async function emitCaseCreated({
  firId,
  caseId,
  caseNumber,
  assignedJudge = "",
}) {
  return safeCall(
    () =>
      contract.emitCaseCreated(
        ethers.id(firId.toString()),
        ethers.id(caseId.toString()),
        String(caseNumber || ""),
        assignedJudge || ""
      ),
    {
      eventType: "CASE_CREATED",
      firId,
      caseId,
      metadata: { caseNumber, assignedJudge },
    }
  );
}

export async function emitCaseUpdated({
  caseId,
  updateType,
  description,
  metadata = "",
}) {
  return safeCall(
    () =>
      contract.emitCaseUpdated(
        ethers.id(caseId.toString()),
        String(updateType || ""),
        String(description || ""),
        metadata || ""
      ),
    {
      eventType: "CASE_UPDATED",
      caseId,
      metadata: { updateType, description, metadata },
    }
  );
}

export async function emitEvidenceSubmitted({
  caseId,
  evidenceId,
  evidenceType,
  ipfsHash,
  description = "",
}) {
  return safeCall(
    () =>
      contract.emitEvidenceSubmitted(
        ethers.id(caseId.toString()),
        ethers.id(evidenceId.toString()),
        String(evidenceType || ""),
        String(ipfsHash || ""),
        description || ""
      ),
    {
      eventType: "EVIDENCE_SUBMITTED",
      caseId,
      evidenceId,
      metadata: { evidenceType, ipfsHash, description },
    }
  );
}

export async function emitCaseStatusChanged({
  caseId,
  oldStatus,
  newStatus,
  reason = "",
}) {
  return safeCall(
    () =>
      contract.emitCaseStatusChanged(
        ethers.id(caseId.toString()),
        String(oldStatus || ""),
        String(newStatus || ""),
        reason || ""
      ),
    {
      eventType: "CASE_STATUS_CHANGED",
      caseId,
      metadata: { oldStatus, newStatus, reason },
    }
  );
}

export async function emitJudgmentPassed({
  caseId,
  verdict,
  ipfsHash,
  reasoning = "",
}) {
  return safeCall(
    () =>
      contract.emitJudgmentPassed(
        ethers.id(caseId.toString()),
        String(verdict || ""),
        String(ipfsHash || ""),
        reasoning || ""
      ),
    {
      eventType: "JUDGMENT_PASSED",
      caseId,
      metadata: { verdict, ipfsHash, reasoning },
    }
  );
}

// Helper function to convert BigInt values to strings for JSON serialization
function convertBigIntToString(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }

  if (typeof obj === "object") {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }

  return obj;
}

// New blockchain query functions for transparency
export async function getCaseMetadata(caseId) {
  try {
    if (TEST_MODE) {
      return {
        ok: true,
        data: {
          caseNumber: "TEST-CASE-001",
          status: "ACTIVE",
          createdAt: Math.floor(Date.now() / 1000),
          lastUpdated: Math.floor(Date.now() / 1000),
          assignedJudge: "Test Judge",
          investigatingOfficer: "Test Officer",
          isActive: true,
        },
      };
    }
    if (!contract) return { ok: false, error: "Contract not initialized" };

    const metadata = await contract.getCaseMetadata(
      ethers.id(caseId.toString())
    );

    // Convert BigInt values to strings
    const convertedMetadata = convertBigIntToString(metadata);
    return { ok: true, data: convertedMetadata };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function getCaseEvidence(caseId) {
  try {
    if (TEST_MODE) {
      return {
        ok: true,
        data: [
          {
            evidenceId: ethers.id("TEST-EVIDENCE-1"),
            evidenceType: "DOCUMENT",
            ipfsHash: "QmTestHash1",
            submitter: "0x1234567890123456789012345678901234567890",
            timestamp: Math.floor(Date.now() / 1000),
            description: "Test evidence document",
            isVerified: true,
          },
        ],
      };
    }
    if (!contract) return { ok: false, error: "Contract not initialized" };

    const evidence = await contract.getCaseEvidence(
      ethers.id(caseId.toString())
    );

    // Convert BigInt values to strings
    const convertedEvidence = convertBigIntToString(evidence);
    return { ok: true, data: convertedEvidence };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function getCaseUpdates(caseId) {
  try {
    if (TEST_MODE) {
      return {
        ok: true,
        data: [
          {
            updateType: "STATUS_CHANGE",
            description: "Case status updated to ACTIVE",
            actor: "0x1234567890123456789012345678901234567890",
            timestamp: Math.floor(Date.now() / 1000),
            metadata: "Initial case creation",
          },
        ],
      };
    }
    if (!contract) return { ok: false, error: "Contract not initialized" };

    const updates = await contract.getCaseUpdates(ethers.id(caseId.toString()));

    // Convert BigInt values to strings
    const convertedUpdates = convertBigIntToString(updates);
    return { ok: true, data: convertedUpdates };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function getBlockchainStats() {
  try {
    if (TEST_MODE) {
      return {
        ok: true,
        data: {
          network: "Polygon Amoy Testnet",
          blockNumber: 12345678,
          gasPrice: "20000000000",
          connected: true,
          contractAddress: "0x1234567890123456789012345678901234567890",
          lastBlockTime: new Date().toISOString(),
        },
      };
    }
    if (!provider) return { ok: false, error: "Provider not initialized" };

    const [blockNumber, gasPrice] = await Promise.all([
      provider.getBlockNumber(),
      provider.getFeeData(),
    ]);

    const latestBlock = await provider.getBlock(blockNumber);

    return {
      ok: true,
      data: {
        network: "Polygon Amoy Testnet",
        blockNumber,
        gasPrice: gasPrice.gasPrice?.toString() || "0",
        connected: true,
        contractAddress,
        lastBlockTime: new Date(latestBlock.timestamp * 1000).toISOString(),
      },
    };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export function isBlockchainReady() {
  return Boolean(contract) && !TEST_MODE;
}

export function isBlockchainTestMode() {
  return TEST_MODE;
}

export function getContractAddress() {
  return contractAddress;
}
