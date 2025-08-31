#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Blockchain Setup Script for Justice System");
console.log("=============================================\n");

// Check if .env exists
const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.log("❌ .env file not found!");
  console.log("Please create a .env file with the required variables.");
  console.log("See BLOCKCHAIN_SETUP_GUIDE.md for details.\n");
  process.exit(1);
}

// Check blockchain dependencies
console.log("📦 Checking blockchain dependencies...");
const blockchainPath = path.join(__dirname, "blockchain");
if (!fs.existsSync(blockchainPath)) {
  console.log("❌ blockchain directory not found!");
  process.exit(1);
}

try {
  // Check if node_modules exists in blockchain directory
  const nodeModulesPath = path.join(blockchainPath, "node_modules");
  if (!fs.existsSync(nodeModulesPath)) {
    console.log("📦 Installing blockchain dependencies...");
    execSync("npm install", { cwd: blockchainPath, stdio: "inherit" });
  } else {
    console.log("✅ Blockchain dependencies already installed");
  }

  // Compile contracts
  console.log("🔨 Compiling smart contracts...");
  execSync("npx hardhat compile", { cwd: blockchainPath, stdio: "inherit" });

  // Check if artifacts exist
  const artifactsPath = path.join(blockchainPath, "artifacts");
  if (!fs.existsSync(artifactsPath)) {
    console.log("❌ Contract compilation failed!");
    process.exit(1);
  }

  console.log("✅ Smart contracts compiled successfully");

  // Check environment variables
  console.log("🔍 Checking environment variables...");
  const envContent = fs.readFileSync(envPath, "utf-8");

  const requiredVars = ["BLOCKCHAIN_TEST_MODE", "AMOY_RPC_URL", "PRIVATE_KEY"];

  const missingVars = [];
  for (const varName of requiredVars) {
    if (!envContent.includes(`${varName}=`)) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.log("❌ Missing required environment variables:");
    missingVars.forEach((varName) => console.log(`   - ${varName}`));
    console.log("\nPlease add these to your .env file");
    process.exit(1);
  }

  // Check if BLOCKCHAIN_TEST_MODE is set to false
  if (envContent.includes("BLOCKCHAIN_TEST_MODE=true")) {
    console.log("⚠️  Warning: BLOCKCHAIN_TEST_MODE is set to true");
    console.log("   This means blockchain functions will be mocked");
    console.log(
      "   Set BLOCKCHAIN_TEST_MODE=false to enable real blockchain operations\n"
    );
  }

  console.log("✅ Environment variables configured");

  // Check if contract is deployed
  const deploymentsPath = path.join(blockchainPath, "deployments");
  const contractAddressPath = path.join(
    deploymentsPath,
    "JusticeEvents.address"
  );

  if (fs.existsSync(contractAddressPath)) {
    const contractAddress = fs
      .readFileSync(contractAddressPath, "utf-8")
      .trim();
    console.log(`✅ Contract already deployed at: ${contractAddress}`);

    // Check if CONTRACT_ADDRESS is set in .env
    if (!envContent.includes("CONTRACT_ADDRESS=")) {
      console.log("⚠️  CONTRACT_ADDRESS not set in .env file");
      console.log(`   Add: CONTRACT_ADDRESS=${contractAddress}`);
    }
  } else {
    console.log("📋 Contract not deployed yet");
    console.log(
      "   Run: cd blockchain && npx hardhat run scripts/deploy.js --network amoy"
    );
  }

  console.log("\n🎉 Blockchain setup check completed!");
  console.log("\nNext steps:");
  console.log(
    "1. If contract not deployed: cd blockchain && npx hardhat run scripts/deploy.js --network amoy"
  );
  console.log("2. Update .env with CONTRACT_ADDRESS if needed");
  console.log("3. Start your backend server: npm start");
  console.log("4. Test blockchain integration through the frontend");
} catch (error) {
  console.error("❌ Setup failed:", error.message);
  process.exit(1);
}

