'use client';

import { useState, useEffect } from 'react';
import { Icons } from '../Icons';

interface LPPosition {
  pair: string;
  liquidity: number;
  apr: number;
  fees24h: number;
  impermanentLoss: number;
  volume24h: number;
}

export function LPInterface() {
  const [positions, setPositions] = useState<LPPosition[]>([
    {
      pair: 'ETH/USDC',
      liquidity: 125000,
      apr: 23.4,
      fees24h: 156.78,
      impermanentLoss: -0.8,
      volume24h: 890000
    },
    {
      pair: 'BTC/USDC',
      liquidity: 89000,
      apr: 18.9,
      fees24h: 98.45,
      impermanentLoss: -0.3,
      volume24h: 567000
    }
  ]);
  
  const [selectedPair, setSelectedPair] = useState('ETH/USDC');
  const [amount, setAmount] = useState('');
  const [totalStats, setTotalStats] = useState({
    totalLiquidity: 12500000,
    totalFees: 4680,
    avgApr: 21.2,
    activePositions: 156
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions(prev => prev.map(pos => ({
        ...pos,
        fees24h: pos.fees24h + Math.random() * 5,
        volume24h: pos.volume24h + Math.random() * 10000,
        apr: pos.apr + (Math.random() - 0.5) * 0.5
      })));
      
      setTotalStats(prev => ({
        ...prev,
        totalLiquidity: prev.totalLiquidity + Math.random() * 50000,
        totalFees: prev.totalFees + Math.random() * 10
      }));
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          marginBottom: '24px'
        }}>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 'bold', margin: '0 0 24px 0' }}>
            💰 Liquidity Provider Dashboard
          </h1>
          
          {/* Overview Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }} className="lp-stats-grid">
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 210, 211, 0.1), rgba(84, 160, 255, 0.1))',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(0, 210, 211, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Total Liquidity</div>
              <div style={{ color: '#00d2d3', fontSize: '24px', fontWeight: 'bold' }}>
                ${totalStats.totalLiquidity.toLocaleString()}
              </div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 210, 211, 0.1))',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>24h Fees Earned</div>
              <div style={{ color: '#00ff88', fontSize: '24px', fontWeight: 'bold' }}>
                ${totalStats.totalFees.toFixed(2)}
              </div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1))',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Average APR</div>
              <div style={{ color: '#ffc107', fontSize: '24px', fontWeight: 'bold' }}>
                {totalStats.avgApr.toFixed(1)}%
              </div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1), rgba(233, 30, 99, 0.1))',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(156, 39, 176, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Active Positions</div>
              <div style={{ color: '#9c27b0', fontSize: '24px', fontWeight: 'bold' }}>
                {totalStats.activePositions}
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="lp-main-grid">
          {/* Add Liquidity */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)'
          }}>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
              ➕ Add Liquidity
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                Trading Pair
              </label>
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '16px'
                }}
              >
                <option value="ETH/USDC" style={{ background: '#1a1a2e' }}>ETH/USDC</option>
                <option value="BTC/USDC" style={{ background: '#1a1a2e' }}>BTC/USDC</option>
                <option value="MATIC/USDC" style={{ background: '#1a1a2e' }}>MATIC/USDC</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                Amount (USDC)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <button style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #00d2d3, #54a0ff)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              Add Liquidity
            </button>
          </div>
          
          {/* Current Positions */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)'
          }}>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
              📊 Your Positions
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {positions.map((position, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                      {position.pair}
                    </div>
                    <div style={{ color: '#00ff88', fontSize: '16px', fontWeight: 'bold' }}>
                      ${position.liquidity.toLocaleString()}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>APR</div>
                      <div style={{ color: '#54a0ff', fontWeight: 'bold' }}>{position.apr.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>24h Fees</div>
                      <div style={{ color: '#ffc107', fontWeight: 'bold' }}>${position.fees24h.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>IL</div>
                      <div style={{ color: position.impermanentLoss >= 0 ? '#00ff88' : '#ff6b6b', fontWeight: 'bold' }}>
                        {position.impermanentLoss.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>24h Volume</div>
                      <div style={{ color: '#9c27b0', fontWeight: 'bold' }}>${(position.volume24h / 1000).toFixed(0)}K</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}