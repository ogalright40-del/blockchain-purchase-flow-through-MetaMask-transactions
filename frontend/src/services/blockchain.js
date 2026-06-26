import { ethers } from "ethers";
import MarketplaceABI from "../contracts/BlockShopMarketplace.json";

/**
 * Returns an ethers Contract instance connected to the
 * BlockShopMarketplace using the address stored in Web3Context
 * deployment info (passed in as `address`).
 */
export const getContract = async (address) => {
  if (!window.ethereum) throw new Error("MetaMask not installed");
  if (!address) throw new Error(
    "Marketplace address not found. Make sure Ganache is running and the contract is deployed."
  );
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer   = await provider.getSigner();
  return new ethers.Contract(address, MarketplaceABI, signer);
};

/**
 * placeOrder — calls the smart-contract `placeOrder` function.
 *
 * @param {string|number} productId  - on-chain product ID
 * @param {number}        qty        - quantity to buy (≥ 1)
 * @param {string}        shipping   - shipping address string (stored on-chain)
 * @param {string}        priceWei   - unit price in Wei (as string / BigInt)
 * @param {string}        contractAddress - marketplace contract address
 * @returns {ethers.TransactionReceipt}
 */
export const placeOrder = async (
  productId,
  qty,
  shipping,
  priceWei,
  contractAddress
) => {
  if (!shipping || !shipping.trim()) {
    throw new Error("Shipping address is required.");
  }

  const contract = await getContract(contractAddress);

  // Total value = unit price × quantity
  const totalValue = BigInt(priceWei.toString()) * BigInt(qty);

  // Send the transaction
  const tx = await contract.placeOrder(
    productId,
    qty,
    shipping.trim(),
    { value: totalValue }
  );

  // Wait for 1 confirmation
  const receipt = await tx.wait();
  return receipt;
};
