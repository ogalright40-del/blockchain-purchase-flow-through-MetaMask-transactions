const { ethers } = require("ethers");
const deployment = require("../config/deployment.json");
const abi = require("../config/abis/BlockShopMarketplace.json");

let provider, contract;

exports.init = async () => {
  provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  contract = new ethers.Contract(
    deployment.marketplaceAddress,
    abi,
    provider
  );
};

exports.getContract = () => contract;