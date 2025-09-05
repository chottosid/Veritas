import "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/../.env" });

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    "celo-sepolia": {
      type: "http",
      url: process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11142220,
      timeout: 60000,
      gas: 2100000,
      gasPrice: 1000000000,
    },
  },
  etherscan: {
    apiKey: process.env.CELOSCAN_API_KEY || "",
  },
};

export default config;
