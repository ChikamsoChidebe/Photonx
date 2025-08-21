'use client';

import { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface ChainInfo {
  id: number;
  name: string;
  symbol: string;
  color: string;
  gasPrice: number;
  blockTime: number;
  tvl: number;
  status: 'active' | 'congested' | 'maintenance';
}

interface BridgeRoute {
  from: ChainInfo;
  to: ChainInfo;
  estimatedTime: string;
  fee: number;
  gasEstimate: number;
  confidence: number;
  route: string[];
}

interface CrossChainTx {
  id: string;
  from: string;
  to: string;
  amount: number;
  token: string;
  status: 'pending' | 'bridging' | 'completed' | 'failed';
  progress: number;
  estimatedTime: string;
  actualTime?: string;
}

export default function CrossChainBridge() {
  const [chains] = useState<ChainInfo[]>([
    {
      id: 1,
      name: 'Ethereum',
      symbol: 'ETH',
      color: '#627eea',
      gasPrice: 25.4,
      blockTime: 12,
      tvl: 45600000000,
      status: 'active'
    },
    {
      id: 137,
      name: 'Polygon',
      symbol: 'MATIC',
      color: '#8247e5',
      gasPrice: 0.02,
      blockTime: 2,
      tvl: 1200000000,
      status: 'active'
    },
    {
      id: 8453,
      name: 'Base',
      symbol: 'ETH',
      color: '#0052ff',
      gasPrice: 0.15,
      blockTime: 2,
      tvl: 890000000,
      status: 'active'
    },
    {
      id: 42161,
      name: 'Arbitrum',
      symbol: 'ETH',
      color: '#28a0f0',
      gasPrice: 0.08,
      blockTime: 1,
      tvl: 2300000000,
      status: 'congested'
    }
  ]);

  const [selectedFromChain, setSelectedFromChain] = useState<ChainInfo>(chains[0]);
  const [selectedToChain, setSelectedToChain] = useState<ChainInfo>(chains[1]);
  const [amount, setAmount] = useState('1000');
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [bridgeRoutes, setBridgeRoutes] = useState<BridgeRoute[]>([]);
  const [activeTxs, setActiveTxs] = useState<CrossChainTx[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Generate optimal bridge routes
    const generateRoutes = () => {
      if (selectedFromChain.id === selectedToChain.id) return [];

      const routes: BridgeRoute[] = [
        {
          from: selectedFromChain,
          to: selectedToChain,
          estimatedTime: '2-5 min',
          fee: 0.05,
          gasEstimate: 150000,
          confidence: 98.5,
          route: ['PhotonX Bridge', 'State Channel']
        },
        {
          from: selectedFromChain,
          to: selectedToChain,
          estimatedTime: '5-10 min',
          fee: 0.12,
          gasEstimate: 280000,
          confidence: 95.2,
          route: ['Stargate', 'LayerZero']
        },
        {
          from: selectedFromChain,
          to: selectedToChain,
          estimatedTime: '10-15 min',
          fee: 0.08,
          gasEstimate: 320000,
          confidence: 92.8,
          route: ['Hop Protocol', 'AMM']
        }
      ];

      return routes.sort((a, b) => b.confidence - a.confidence);
    };

    setBridgeRoutes(generateRoutes());
  }, [selectedFromChain, selectedToChain]);

  useEffect(() => {
    // Simulate active transactions
    const mockTxs: CrossChainTx[] = [
      {
        id: '0x1a2b3c...',
        from: 'Ethereum',
        to: 'Polygon',
        amount: 5000,
        token: 'USDC',
        status: 'bridging',
        progress: 65,
        estimatedTime: '2 min remaining'
      },
      {
        id: '0x4d5e6f...',
        from: 'Base',
        to: 'Arbitrum',
        amount: 1200,
        token: 'ETH',
        status: 'completed',
        progress: 100,
        estimatedTime: 'Completed',
        actualTime: '3m 24s'
      }
    ];

    setActiveTxs(mockTxs);

    // Update progress for active transactions
    const interval = setInterval(() => {
      setActiveTxs(prev => prev.map(tx => 
        tx.status === 'bridging' 
          ? { ...tx, progress: Math.min(100, tx.progress + Math.random() * 5) }
          : tx
      ));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleBridge = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newTx: CrossChainTx = {
      id: `0x${Math.random().toString(16).slice(2, 8)}...`,
      from: selectedFromChain.name,
      to: selectedToChain.name,
      amount: parseFloat(amount),
      token: selectedToken,
      status: 'pending',
      progress: 0,
      estimatedTime: bridgeRoutes[0]?.estimatedTime || '2-5 min'
    };

    setActiveTxs(prev => [newTx, ...prev]);
    setIsAnalyzing(false);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          <Icons.Bridge /> Cross-Chain Bridge
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '4px 0 0 0' }}>
          Instant cross-chain transfers with optimal routing
        </p>
      </div>

      {/* Chain Status Overview */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
          <Icons.Link /> Network Status
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }} className="chain-status-grid">
          {chains.map((chain) => (
            <div key={chain.id} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '12px',
              border: `1px solid ${chain.color}30`,
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: chain.status === 'active' ? '#00ff88' : 
                           chain.status === 'congested' ? '#ffc107' : '#ff6b6b'
              }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: chain.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  {chain.symbol.slice(0, 2)}
                </div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
                  {chain.name}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Gas: {chain.gasPrice < 1 ? `${chain.gasPrice.toFixed(3)}` : `${chain.gasPrice.toFixed(1)}`} gwei
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {chain.blockTime}s blocks
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bridge Interface */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {/* From Chain */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
              From
            </label>
            <div style={{ display: 'flex', gap: '12px' }} className="bridge-form-row">
              <select
                value={selectedFromChain.id}
                onChange={(e) => setSelectedFromChain(chains.find(c => c.id === parseInt(e.target.value))!)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  flex: 1
                }}
              >
                {chains.map((chain) => (
                  <option key={chain.id} value={chain.id} style={{ background: '#1a1a2e' }}>
                    {chain.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  width: '120px'
                }}
              />
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  width: '100px'
                }}
              >
                <option value="USDC" style={{ background: '#1a1a2e' }}>USDC</option>
                <option value="ETH" style={{ background: '#1a1a2e' }}>ETH</option>
                <option value="MATIC" style={{ background: '#1a1a2e' }}>MATIC</option>
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
            <button
              onClick={() => {
                const temp = selectedFromChain;
                setSelectedFromChain(selectedToChain);
                setSelectedToChain(temp);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}
            >
              <Icons.ArrowUpDown />
            </button>
          </div>

          {/* To Chain */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
              To
            </label>
            <select
              value={selectedToChain.id}
              onChange={(e) => setSelectedToChain(chains.find(c => c.id === parseInt(e.target.value))!)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '12px',
                color: '#fff',
                fontSize: '14px',
                width: '100%'
              }}
            >
              {chains.filter(c => c.id !== selectedFromChain.id).map((chain) => (
                <option key={chain.id} value={chain.id} style={{ background: '#1a1a2e' }}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bridge Routes */}
          {bridgeRoutes.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
                🛣️ Optimal Routes
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bridgeRoutes.slice(0, 3).map((route, index) => (
                  <div key={index} style={{
                    background: index === 0 ? 'rgba(0, 210, 211, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    border: index === 0 ? '1px solid rgba(0, 210, 211, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                        {route.route.join(' → ')}
                        {index === 0 && <span style={{ color: '#00d2d3', marginLeft: '8px' }}>RECOMMENDED</span>}
                      </div>
                      <div style={{ color: '#00ff88', fontSize: '12px', fontWeight: 'bold' }}>
                        {route.confidence}% success
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      <span>Time: {route.estimatedTime}</span>
                      <span>Fee: ${route.fee.toFixed(3)}</span>
                      <span>Gas: {route.gasEstimate.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bridge Button */}
          <button
            onClick={handleBridge}
            disabled={isAnalyzing || selectedFromChain.id === selectedToChain.id}
            style={{
              background: isAnalyzing 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #00d2d3, #54a0ff)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              width: '100%',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              opacity: isAnalyzing ? 0.6 : 1
            }}
          >
            {isAnalyzing ? <><Icons.Refresh /> Analyzing Routes...</> : <><Icons.Rocket /> Bridge Assets</>}
          </button>
        </div>
      </div>

      {/* Active Transactions */}
      {activeTxs.length > 0 && (
        <div>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
            <Icons.Refresh /> Active Transactions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeTxs.map((tx) => (
              <div key={tx.id} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>
                    {tx.amount.toLocaleString()} {tx.token}
                  </div>
                  <div style={{
                    background: tx.status === 'completed' ? 'rgba(0, 255, 136, 0.2)' : 
                               tx.status === 'bridging' ? 'rgba(255, 193, 7, 0.2)' : 
                               'rgba(84, 160, 255, 0.2)',
                    color: tx.status === 'completed' ? '#00ff88' : 
                           tx.status === 'bridging' ? '#ffc107' : '#54a0ff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {tx.status.toUpperCase()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {tx.from} → {tx.to}
                  </span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {tx.id}
                  </span>
                </div>

                {tx.status === 'bridging' && (
                  <div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      height: '6px',
                      overflow: 'hidden',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        background: 'linear-gradient(90deg, #00d2d3, #54a0ff)',
                        height: '100%',
                        width: `${tx.progress}%`,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '10px' }}>
                      {tx.progress.toFixed(0)}% complete • {tx.estimatedTime}
                    </div>
                  </div>
                )}

                {tx.status === 'completed' && tx.actualTime && (
                  <div style={{ color: '#00ff88', fontSize: '10px' }}>
                    <Icons.CheckCircle /> Completed in {tx.actualTime}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}