require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    // Built-in Hardhat node (kept for tests)
    hardhat: { chainId: 31337 },

    // ── Ganache Local (GUI or CLI) ────────────────────────────────────────
    ganache: {
      url: "http://127.0.0.1:7545",   // Ganache default port
      chainId: 1337,                   // Ganache default chainId
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },

    // Alias: "localhost" also points to Ganache so existing scripts still work
    localhost: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
    },

    // Remote networks
    sepolia: {
      url:      process.env.SEPOLIA_RPC_URL  || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    },
    mainnet: {
      url:      process.env.MAINNET_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1
    }
  },
  etherscan: { apiKey: process.env.ETHERSCAN_API_KEY || "" },
  paths: { sources: "./contracts", tests: "./test", cache: "./cache", artifacts: "./artifacts" }
};
