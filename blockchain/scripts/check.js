import hre from "hardhat";

console.log("hre keys:", Object.keys(hre));
console.log("ethers available:", !!hre.ethers);
if (hre.ethers) {
  console.log("ethers version:", hre.ethers.version || "unknown");
}
