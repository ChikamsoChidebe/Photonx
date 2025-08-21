'use client';

import { useWallet } from '../hooks/useWallet';

export function WalletButton() {
  const { 
    isConnected, 
    address, 
    balance, 
    chainId, 
    connectWallet, 
    disconnectWallet, 
    switchNetwork, 
    isConnecting 
  } = useWallet();

  const handleNetworkSwitch = async () => {
    if (chainId && ![1, 137, 42161, 8453, 31337].includes(chainId)) {
      await switchNetwork(31337); // Default to Local
    }
  };

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        style={{
          background: isConnecting 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'linear-gradient(135deg, #00d2d3, #54a0ff)',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          opacity: isConnecting ? 0.7 : 1,
          transition: 'all 0.3s ease'
        }}
      >
        {isConnecting ? '🔄 Connecting...' : '💳 Connect Wallet'}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <div style={{
        background: 'rgba(0, 255, 136, 0.1)',
        border: '1px solid rgba(0, 255, 136, 0.3)',
        borderRadius: '12px',
        padding: '8px 16px',
        color: '#00ff88',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        ✅ {address?.slice(0, 6)}...{address?.slice(-4)}
      </div>
      
      <div style={{
        background: 'rgba(84, 160, 255, 0.1)',
        border: '1px solid rgba(84, 160, 255, 0.3)',
        borderRadius: '12px',
        padding: '8px 16px',
        color: '#54a0ff',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        💰 {parseFloat(balance || '0').toFixed(4)} ETH
      </div>
      
      {chainId && ![1, 137, 42161, 8453, 31337].includes(chainId) && (
        <button
          onClick={handleNetworkSwitch}
          style={{
            background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ⚠️ Switch Network
        </button>
      )}
      
      <button
        onClick={disconnectWallet}
        style={{
          background: 'rgba(255, 107, 107, 0.2)',
          color: '#ff6b6b',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        🚪 Disconnect
      </button>
    </div>
  );
}