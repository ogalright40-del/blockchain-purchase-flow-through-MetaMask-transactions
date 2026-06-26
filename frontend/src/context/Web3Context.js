import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { connectWallet, shortenAddress, blockchainAPI } from '../utils/api';
import toast from 'react-hot-toast';

// Import ABIs directly (bundled with app, always available)
import MarketplaceABI from '../contracts/BlockShopMarketplace.json';
import TokenABI from '../contracts/BlockShopToken.json';

// ─── Ganache Local Network ──────────────────────────────────────────────────
const GANACHE_CHAIN_ID    = 1337;
const GANACHE_CHAIN_ID_HEX = '0x539';  // 1337 in hex
const GANACHE_RPC_URL     = 'http://127.0.0.1:7545';
const GANACHE_CHAIN_NAME  = 'Ganache Local';

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount]       = useState(null);
  const [balance, setBalance]       = useState('0');
  const [bstBalance, setBstBalance] = useState('0');
  const [network, setNetwork]       = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [deployment, setDeployment] = useState(null);
  const [blockchainOnline, setBlockchainOnline] = useState(false);

  // Load deployment info from backend
  const loadDeployment = useCallback(async () => {
    try {
      const res = await blockchainAPI.getInfo();
      setDeployment(res.data.deployment);
      setBlockchainOnline(res.data.connected);
    } catch {}
  }, []);

  useEffect(() => { loadDeployment(); }, [loadDeployment]);

  // ── Fetch ETH balance directly from Ganache RPC ──────────────────────────
  const fetchEthBalance = useCallback(async (addr) => {
    if (!addr) return '0';
    try {
      // First try MetaMask BrowserProvider (works when MetaMask is on Ganache)
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const bal = await provider.getBalance(addr);
        return ethers.formatEther(bal);
      }
      // Fallback: query Ganache directly
      const provider = new ethers.JsonRpcProvider(GANACHE_RPC_URL);
      const bal = await provider.getBalance(addr);
      return ethers.formatEther(bal);
    } catch {
      // Final fallback: eth_getBalance via raw RPC
      try {
        const provider = new ethers.JsonRpcProvider(GANACHE_RPC_URL);
        const bal = await provider.getBalance(addr);
        return ethers.formatEther(bal);
      } catch {
        return '0';
      }
    }
  }, []);

  // Restore account from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('blockshop_account');
    if (saved && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts[0] && accounts[0].toLowerCase() === saved.toLowerCase()) {
          setAccount(accounts[0]);
        }
      }).catch(() => {});
    }
  }, []);

  // Fetch balances when account changes
  useEffect(() => {
    if (!account) { setBalance('0'); setBstBalance('0'); return; }

    // Fetch ETH balance with retry
    const fetchBal = async () => {
      const bal = await fetchEthBalance(account);
      setBalance(bal);
    };
    fetchBal();

    // Poll balance every 5 seconds so it stays fresh
    const interval = setInterval(fetchBal, 5000);

    // Fetch BST token balance
    blockchainAPI.getToken(account)
      .then(r => setBstBalance(r.data.balance || '0'))
      .catch(() => {});

    return () => clearInterval(interval);
  }, [account, fetchEthBalance]);

  // MetaMask event listeners
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) { disconnect(); }
      else {
        setAccount(accounts[0]);
        localStorage.setItem('blockshop_account', accounts[0]);
      }
    };
    const onChainChanged = () => window.location.reload();
    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener('chainChanged', onChainChanged);
    };
  }, []);

  // ── Switch MetaMask to Ganache ────────────────────────────────────────────
  const switchToLocalNetwork = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not detected!');
      return;
    }
    try {
      // Try switching first (works if chain already added)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: GANACHE_CHAIN_ID_HEX }],
      });
    } catch (switchErr) {
      // Chain not added yet → add it
      if (switchErr.code === 4902 || switchErr.code === -32603) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: GANACHE_CHAIN_ID_HEX,
              chainName: GANACHE_CHAIN_NAME,
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: [GANACHE_RPC_URL],
            }],
          });
        } catch (addErr) {
          toast.error('Could not add Ganache network: ' + addErr.message);
        }
      } else {
        toast.error('Could not switch network: ' + switchErr.message);
      }
    }
  }, []);

  const connect = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not detected! Please install MetaMask.', { duration: 5000 });
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    setConnecting(true);
    try {
      // Ensure we're on Ganache before connecting
      const provider = new ethers.BrowserProvider(window.ethereum);
      const net = await provider.getNetwork();
      if (Number(net.chainId) !== GANACHE_CHAIN_ID) {
        toast('Switching to Ganache Local network…', { icon: '🔄' });
        await switchToLocalNetwork();
      }

      const addr = await connectWallet();
      setAccount(addr);
      localStorage.setItem('blockshop_account', addr);

      // Re-create provider after possible network switch
      const updatedProvider = new ethers.BrowserProvider(window.ethereum);
      const updatedNet = await updatedProvider.getNetwork();
      setNetwork({ name: GANACHE_CHAIN_NAME, chainId: Number(updatedNet.chainId) });

      // Fetch balance directly
      const bal = await updatedProvider.getBalance(addr);
      setBalance(ethers.formatEther(bal));

      toast.success(`Connected: ${shortenAddress(addr)}`);
      loadDeployment();
    } catch (err) {
      if (err.code !== 4001) toast.error(err.message || 'Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setBalance('0');
    setBstBalance('0');
    localStorage.removeItem('blockshop_account');
    toast.success('Wallet disconnected');
  };

  const getSigner = async () => {
    if (!window.ethereum) throw new Error('MetaMask not found');
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider.getSigner();
  };

  const getMarketplace = async () => {
    const addr = deployment?.contracts?.BlockShopMarketplace?.address;
    if (!addr) throw new Error('Marketplace contract not deployed yet. Run: cd blockchain && npx hardhat run scripts/deploy.js --network ganache');
    const signer = await getSigner();
    return new ethers.Contract(addr, MarketplaceABI, signer);
  };

  const getToken = async () => {
    const addr = deployment?.contracts?.BlockShopToken?.address;
    if (!addr) throw new Error('Token contract not deployed yet.');
    const signer = await getSigner();
    return new ethers.Contract(addr, TokenABI, signer);
  };

  return (
    <Web3Context.Provider value={{
      account, balance, bstBalance, network, connecting,
      deployment, blockchainOnline,
      connect, disconnect, getSigner, getMarketplace, getToken,
      switchToLocalNetwork, loadDeployment,
      ganacheChainId: GANACHE_CHAIN_ID,
      ganacheRpcUrl: GANACHE_RPC_URL,
    }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error('useWeb3 must be used inside Web3Provider');
  return ctx;
};
