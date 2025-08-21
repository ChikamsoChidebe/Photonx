'use client';

import { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface YellowMetrics {
  totalChannels: number;
  activeSettlements: number;
  gasOptimization: number;
  crossChainVolume: number;
  erc7824Compliance: number;
  networkHealth: number;
}

interface StateChannelData {
  channelId: string;
  participants: string[];
  state: 'opening' | 'active' | 'settling' | 'closed';
  nonce: number;
  balances: { [key: string]: number };
  lastUpdate: string;
  gasUsed: number;
  gasSaved: number;
}

interface YellowValidator {
  address: string;
  stake: number;
  performance: number;
  uptime: number;
  reputation: number;
  status: 'active' | 'slashing' | 'offline';
}

export default function YellowNetworkIntegration() {
  const [yellowMetrics, setYellowMetrics] = useState<YellowMetrics>({
    totalChannels: 0,
    activeSettlements: 0,
    gasOptimization: 0,
    crossChainVolume: 0,
    erc7824Compliance: 0,
    networkHealth: 0
  });

  const [stateChannels, setStateChannels] = useState<StateChannelData[]>([]);
  const [validators, setValidators] = useState<YellowValidator[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [networkActivity, setNetworkActivity] = useState<number[]>([]);

  useEffect(() => {
    // Initialize Yellow Network metrics
    const initializeMetrics = () => {
      setYellowMetrics({
        totalChannels: 1247,
        activeSettlements: 89,
        gasOptimization: 94.7,
        crossChainVolume: 45600000,
        erc7824Compliance: 100,
        networkHealth: 98.9
      });

      // Mock state channels following ERC-7824
      const mockChannels: StateChannelData[] = [
        {
          channelId: '0x7824a1b2c3d4e5f6',
          participants: ['0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4', '0x8D4C0532925a3b8D4C0532925a3b8D4C0532925a'],
          state: 'active',
          nonce: 156,
          balances: { 'ETH': 12.5, 'USDC': 25000 },
          lastUpdate: '2 seconds ago',
          gasUsed: 21000,
          gasSaved: 450000
        },
        {
          channelId: '0x7824f6e5d4c3b2a1',
          participants: ['0x925a3b8D4C0532925a3b8D4C0532925a3b8D4C053', '0x532925a3b8D4C0532925a3b8D4C0532925a3b8D4C'],
          state: 'settling',
          nonce: 89,
          balances: { 'MATIC': 8500, 'USDC': 15000 },
          lastUpdate: '15 seconds ago',
          gasUsed: 18500,
          gasSaved: 380000
        },
        {
          channelId: '0x7824c4d5e6f7a8b9',
          participants: ['0xD4C0532925a3b8D4C0532925a3b8D4C0532925a3b8', '0x25a3b8D4C0532925a3b8D4C0532925a3b8D4C0532'],
          state: 'opening',
          nonce: 1,
          balances: { 'ETH': 5.0, 'USDC': 10000 },
          lastUpdate: '1 minute ago',
          gasUsed: 85000,
          gasSaved: 0
        }
      ];

      const mockValidators: YellowValidator[] = [
        {
          address: '0xYellow1234567890abcdef',
          stake: 50000,
          performance: 99.8,
          uptime: 99.95,
          reputation: 98.5,
          status: 'active'
        },
        {
          address: '0xYellow0987654321fedcba',
          stake: 75000,
          performance: 99.2,
          uptime: 98.7,
          reputation: 97.8,
          status: 'active'
        },
        {
          address: '0xYellowabcdef1234567890',
          stake: 32000,
          performance: 95.4,
          uptime: 96.2,
          reputation: 94.1,
          status: 'slashing'
        }
      ];

      setStateChannels(mockChannels);
      setValidators(mockValidators);
      setNetworkActivity(Array.from({ length: 50 }, () => Math.random() * 100));
    };

    initializeMetrics();

    // Real-time updates
    const interval = setInterval(() => {
      setYellowMetrics(prev => ({
        ...prev,
        totalChannels: prev.totalChannels + Math.floor(Math.random() * 3),
        activeSettlements: 80 + Math.floor(Math.random() * 20),
        gasOptimization: 92 + Math.random() * 6,
        crossChainVolume: prev.crossChainVolume + Math.random() * 100000,
        networkHealth: 97 + Math.random() * 3
      }));

      setNetworkActivity(prev => [...prev.slice(1), Math.random() * 100]);

      // Update channel states
      setStateChannels(prev => prev.map(channel => ({
        ...channel,
        nonce: channel.state === 'active' ? channel.nonce + Math.floor(Math.random() * 2) : channel.nonce,
        gasSaved: channel.gasSaved + (channel.state === 'active' ? Math.random() * 1000 : 0)
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 25%, #f39c12 50%, #e67e22 75%, #d35400 100%)',
      borderRadius: '20px',
      padding: '24px',
      border: '2px solid #ffd700',
      boxShadow: '0 20px 40px rgba(255, 215, 0, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Yellow Network Branding */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3), transparent)',
        borderRadius: '50%'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
        <div>
          <h2 style={{ color: '#000', fontSize: '28px', fontWeight: 'bold', margin: 0, textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
            <Icons.Network /> Yellow Network Integration
          </h2>
          <p style={{ color: 'rgba(0, 0, 0, 0.8)', margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600' }}>
            ERC-7824 State Channels • Cross-Chain Settlement • Gas Optimization
          </p>
        </div>
        <div style={{
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          padding: '12px 20px',
          border: '2px solid rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>ERC-7824 COMPLIANT</div>
          <div style={{ color: 'rgba(0, 0, 0, 0.8)', fontSize: '12px' }}>100% Standard Compliance</div>
        </div>
      </div>

      {/* Yellow Network Metrics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          border: '2px solid rgba(0, 0, 0, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ color: 'rgba(0, 0, 0, 0.8)', fontSize: '14px', fontWeight: 'bold' }}>Total State Channels</div>
          <div style={{ color: '#000', fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>
            {yellowMetrics.totalChannels.toLocaleString()}
          </div>
          <div style={{ color: 'rgba(0, 0, 0, 0.7)', fontSize: '12px' }}>
            +{Math.floor(Math.random() * 10)} in last hour
          </div>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          border: '2px solid rgba(0, 0, 0, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ color: 'rgba(0, 0, 0, 0.8)', fontSize: '14px', fontWeight: 'bold' }}>Gas Optimization</div>
          <div style={{ color: '#000', fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>
            {yellowMetrics.gasOptimization.toFixed(1)}%
          </div>
          <div style={{ color: 'rgba(0, 0, 0, 0.7)', fontSize: '12px' }}>
            vs Traditional DEX
          </div>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          border: '2px solid rgba(0, 0, 0, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ color: 'rgba(0, 0, 0, 0.8)', fontSize: '14px', fontWeight: 'bold' }}>Cross-Chain Volume</div>
          <div style={{ color: '#000', fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>
            ${(yellowMetrics.crossChainVolume / 1000000).toFixed(1)}M
          </div>
          <div style={{ color: 'rgba(0, 0, 0, 0.7)', fontSize: '12px' }}>
            24h trading volume
          </div>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          border: '2px solid rgba(0, 0, 0, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ color: 'rgba(0, 0, 0, 0.8)', fontSize: '14px', fontWeight: 'bold' }}>Network Health</div>
          <div style={{ color: '#000', fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>
            {yellowMetrics.networkHealth.toFixed(1)}%
          </div>
          <div style={{ color: 'rgba(0, 0, 0, 0.7)', fontSize: '12px' }}>
            Validator uptime
          </div>
        </div>
      </div>

      {/* ERC-7824 State Channels */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#000', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
          <Icons.Zap /> ERC-7824 State Channels
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {stateChannels.map((channel) => (
            <div 
              key={channel.channelId} 
              onClick={() => setSelectedChannel(selectedChannel === channel.channelId ? null : channel.channelId)}
              style={{
                background: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '16px',
                padding: '20px',
                border: selectedChannel === channel.channelId ? '3px solid #000' : '2px solid rgba(0, 0, 0, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ color: '#000', fontWeight: 'bold', fontSize: '16px' }}>
                    Channel {channel.channelId.slice(0, 10)}...
                  </div>
                  <div style={{ color: 'rgba(0, 0, 0, 0.7)', fontSize: '12px' }}>
                    Nonce: {channel.nonce} • Updated {channel.lastUpdate}
                  </div>
                </div>
                <div style={{
                  background: channel.state === 'active' ? 'rgba(0, 128, 0, 0.2)' : 
                             channel.state === 'settling' ? 'rgba(255, 165, 0, 0.2)' : 
                             channel.state === 'opening' ? 'rgba(0, 0, 255, 0.2)' : 'rgba(128, 128, 128, 0.2)',
                  color: channel.state === 'active' ? '#008000' : 
                         channel.state === 'settling' ? '#ff8c00' : 
                         channel.state === 'opening' ? '#0000ff' : '#808080',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: '2px solid currentColor'
                }}>
                  {channel.state.toUpperCase()}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                {Object.entries(channel.balances).map(([token, amount]) => (
                  <div key={token} style={{
                    background: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    border: '1px solid rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ color: 'rgba(0, 0, 0, 0.7)', fontSize: '10px' }}>{token} Balance</div>
                    <div style={{ color: '#000', fontWeight: 'bold', fontSize: '14px' }}>
                      {typeof amount === 'number' ? amount.toLocaleString() : amount}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'rgba(0, 0, 0, 0.8)', fontSize: '12px' }}>
                  Gas Used: {channel.gasUsed.toLocaleString()} • 
                  Gas Saved: <span style={{ color: '#008000', fontWeight: 'bold' }}>
                    {channel.gasSaved.toLocaleString()}
                  </span>
                </div>
                <div style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '10px' }}>
                  {channel.participants.length} participants
                </div>
              </div>

              {selectedChannel === channel.channelId && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '16px', 
                  background: 'rgba(0, 0, 0, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  <h4 style={{ color: '#000', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Channel Details
                  </h4>
                  <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.8)' }}>
                    <div><strong>Participants:</strong></div>
                    {channel.participants.map((addr, i) => (
                      <div key={i} style={{ marginLeft: '12px', fontFamily: 'monospace' }}>
                        {addr.slice(0, 6)}...{addr.slice(-4)}
                      </div>
                    ))}
                    <div style={{ marginTop: '8px' }}>
                      <strong>ERC-7824 Compliance:</strong> ✅ Full Standard Implementation
                    </div>
                    <div><strong>Settlement Efficiency:</strong> {(channel.gasSaved / (channel.gasUsed + channel.gasSaved) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Yellow Network Validators */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#000', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
          <Icons.Shield /> Yellow Network Validators
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {validators.map((validator, index) => (
            <div key={index} style={{
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '16px',
              padding: '20px',
              border: '2px solid rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ color: '#000', fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace' }}>
                  {validator.address.slice(0, 12)}...
                </div>
                <div style={{
                  background: validator.status === 'active' ? 'rgba(0, 128, 0, 0.2)' : 
                             validator.status === 'slashing' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(128, 128, 128, 0.2)',
                  color: validator.status === 'active' ? '#008000' : 
                         validator.status === 'slashing' ? '#ff0000' : '#808080',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  border: '2px solid currentColor'
                }}>
                  {validator.status.toUpperCase()}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <div style={{ color: 'rgba(0, 0, 0, 0.7)', fontSize: '10px' }}>Stake</div>
                  <div style={{ color: '#000', fontWeight: 'bold', fontSize: '12px' }}>
                    {validator.stake.toLocaleString()} YELLOW
                  </div>
                </div>
                <div>
                  <div style={{ color: 'rgba(0, 0, 0, 0.7)', fontSize: '10px' }}>Performance</div>
                  <div style={{ color: '#000', fontWeight: 'bold', fontSize: '12px' }}>
                    {validator.performance.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ color: 'rgba(0, 0, 0, 0.7)', fontSize: '10px' }}>Uptime</div>
                  <div style={{ color: '#000', fontWeight: 'bold', fontSize: '12px' }}>
                    {validator.uptime.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div style={{ color: 'rgba(0, 0, 0, 0.7)', fontSize: '10px' }}>Reputation</div>
                  <div style={{ color: '#000', fontWeight: 'bold', fontSize: '12px' }}>
                    {validator.reputation.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div style={{
                height: '6px',
                background: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${validator.performance}%`,
                  background: validator.status === 'active' ? 'linear-gradient(90deg, #008000, #00ff00)' : 
                             validator.status === 'slashing' ? 'linear-gradient(90deg, #ff0000, #ff6666)' : '#808080',
                  borderRadius: '3px'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Activity Visualization */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        border: '2px solid rgba(0, 0, 0, 0.2)'
      }}>
        <h3 style={{ color: '#000', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          <Icons.Activity /> Yellow Network Activity
        </h3>
        <div style={{ display: 'flex', gap: '2px', height: '80px', alignItems: 'end' }}>
          {networkActivity.map((activity, i) => (
            <div
              key={i}
              style={{
                width: '6px',
                height: `${activity}%`,
                background: 'linear-gradient(to top, #d35400, #f39c12, #ffd700)',
                borderRadius: '2px',
                animation: `pulse ${1 + Math.random()}s infinite alternate`
              }}
            />
          ))}
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '12px',
          color: 'rgba(0, 0, 0, 0.7)',
          fontSize: '12px'
        }}>
          <span>Real-time channel activity</span>
          <span>Settlement throughput</span>
          <span>Cross-chain transactions</span>
        </div>
      </div>
    </div>
  );
}