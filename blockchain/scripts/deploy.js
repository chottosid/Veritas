import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { ethers } from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // Load env from Backend/.env
  dotenv.config({ path: resolve(__dirname, "../../.env") });
  const rpcUrl = process.env.AMOY_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  if (!rpcUrl || !privateKey) {
    throw new Error("Missing AMOY_RPC_URL or PRIVATE_KEY in environment");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const artifactPath = resolve(
    __dirname,
    "../artifacts/contracts/JusticeEvents.sol/JusticeEvents.json"
  );
  const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );
  const contract = await factory.deploy();
  const receipt = await contract.deploymentTransaction().wait();
  const address = await contract.getAddress();
  console.log("JusticeEvents deployed to:", address);

  // Persist address and ABI for backend consumption
  const outDir = resolve(__dirname, "../deployments");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "JusticeEvents.address"), address, "utf-8");
  writeFileSync(
    resolve(outDir, "JusticeEvents.abi.json"),
    JSON.stringify(artifact.abi, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
