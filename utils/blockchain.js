import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { ethers } from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

let provider = null;
let wallet = null;
let contract = null;
let abi = null;
let contractAddress = process.env.CONTRACT_ADDRESS || "";

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

async function safeCall(promiseFactory) {
  try {
    if (!contract) return { ok: false, skipped: true };
    const tx = await promiseFactory();
    // Don't await confirmations to avoid slowing API; still wait for hash
    return { ok: true, hash: tx.hash };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function emitComplaintFiled({
  complaintId,
  actor,
  title,
  area,
  ipfsSummary = "",
}) {
  return safeCall(() =>
    contract.emitComplaintFiled(
      ethers.id(complaintId.toString()),
      title || "",
      area || "",
      ipfsSummary || ""
    )
  );
}

export async function emitFIRRegistered({
  complaintId,
  firId,
  firNumber,
  sections,
}) {
  return safeCall(() =>
    contract.emitFIRRegistered(
      ethers.id(complaintId.toString()),
      ethers.id(firId.toString()),
      String(firNumber || ""),
      Array.isArray(sections) ? sections.join(",") : String(sections || "")
    )
  );
}

export async function emitCaseCreated({ firId, caseId, caseNumber }) {
  return safeCall(() =>
    contract.emitCaseCreated(
      ethers.id(firId.toString()),
      ethers.id(caseId.toString()),
      String(caseNumber || "")
    )
  );
}

export async function emitCaseUpdated({ caseId, updateType, description }) {
  return safeCall(() =>
    contract.emitCaseUpdated(
      ethers.id(caseId.toString()),
      String(updateType || ""),
      String(description || "")
    )
  );
}

export function isBlockchainReady() {
  return Boolean(contract);
}
