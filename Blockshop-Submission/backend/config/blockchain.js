const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

let provider = null;
let marketplaceContract = null;
let tokenContract = null;
let deploymentData = null;
let isConnected = false;

function loadDeployment() {
  const p = path.join(__dirname, 'deployment.json');
  if (fs.existsSync(p)) {
    deploymentData = JSON.parse(fs.readFileSync(p));
    return deploymentData;
  }
  return null;
}

function loadABI(name) {
  const p = path.join(__dirname, 'abis', `${name}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : [];
}

async function initBlockchain() {
  try {
    const dep = loadDeployment();
    if (!dep) { console.warn('⚠️  No deployment.json — running in MOCK mode'); return false; }

    provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'http://127.0.0.1:7545');
    await provider.getNetwork(); // throws if unreachable

    const mABI = loadABI('BlockShopMarketplace');
    const tABI = loadABI('BlockShopToken');

    if (mABI.length) {
      marketplaceContract = new ethers.Contract(dep.contracts.BlockShopMarketplace.address, mABI, provider);
    }
    if (tABI.length) {
      tokenContract = new ethers.Contract(dep.contracts.BlockShopToken.address, tABI, provider);
    }

    isConnected = true;
    console.log('✅ Blockchain connected');
    console.log('   Network    :', dep.network);
    console.log('   ChainId    :', dep.chainId);
    console.log('   Marketplace:', dep.contracts.BlockShopMarketplace.address);
    console.log('   BST Token  :', dep.contracts.BlockShopToken.address);
    return true;
  } catch (err) {
    console.warn('⚠️  Blockchain offline — MOCK mode active');
    console.warn('   Start Ganache (GUI or CLI on port 7545), then: cd blockchain && npx hardhat run scripts/deploy.js --network ganache');
    return false;
  }
}

const getProvider    = () => provider;
const getMarketplace = () => marketplaceContract;
const getToken       = () => tokenContract;
const getDeployment  = () => deploymentData || loadDeployment();
const getIsConnected = () => isConnected;

module.exports = { initBlockchain, getProvider, getMarketplace, getToken, getDeployment, getIsConnected };
