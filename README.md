# BlockShop — Ethereum E-Commerce Platform

BlockShop is a decentralized e-commerce platform built on Ethereum, designed to enable trustless buying and selling of products using smart contracts. The platform removes reliance on centralized intermediaries by leveraging blockchain technology for payments, escrow, and transaction verification.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- [MetaMask](https://metamask.io/) browser extension

---

## 1. Deploy Smart Contracts

```bash
cd blockchain
npm install
cp .env.example .env
# Paste one of Ganache's account private keys into .env → PRIVATE_KEY=0x...
npx hardhat run scripts/deploy.js --network ganache
```

This writes `deployment.json` to both `backend/config/` and `frontend/src/contracts/`.

---

## 2. Start Backend

```bash
cd backend
npm install
# ETH_RPC_URL=http://127.0.0.1:7545 is already set in .env
npm start
```

Backend runs on **http://localhost:5001**

---

## 3. Start Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on **http://localhost:3000**

---

## 4. Configure MetaMask

Add Ganache network to MetaMask:
| Field | Value |
|---|---|
| Network Name | Ganache Local |
| RPC URL | http://127.0.0.1:7545 |
| Chain ID | 1337 |
| Currency Symbol | ETH |

> **Tip:** The app auto-prompts MetaMask to switch/add Ganache when you click "Connect Wallet".

---

## Project Structure

```
blockshop/
├── blockchain/          # Hardhat project — Solidity contracts
│   ├── contracts/       # BlockShopMarketplace.sol, BlockShopToken.sol
│   ├── scripts/         # deploy.js
│   └── hardhat.config.js
├── backend/             # Express API
│   ├── config/
│   │   ├── blockchain.js   # Ethers.js provider (Ganache: 127.0.0.1:7545)
│   │   └── .env            # ETH_RPC_URL=http://127.0.0.1:7545
│   └── routes/
├── frontend/            # React app
│   └── src/
│       └── context/
│           └── Web3Context.js  # Ganache chainId 1337, port 7545
└── README.md
```

---

