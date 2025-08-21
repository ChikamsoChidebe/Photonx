'use client';

import { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
  liquidity: number;
  volatility: number;
}

interface NetworkMetrics {
  tps: number;
  gasPrice: number;
  blockTime: number;
  congestion: number;
  activeChannels: number;
  totalVolume: number;
}

interface ArbitrageOpportunity {
  pair: string;
  exchange1: string;
  exchange2: string;
  priceDiff: number;
  profitPotential: number;
  confidence: number;
}

export default function RealTimeAnalytics() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics>({
    tps: 0,
    gasPrice: 0,
    blockTime: 0,
    congestion: 0,
    activeChannels: 0,
    totalVolume: 0
  });
  const [arbitrageOps, setArbitrageOps] = useState<ArbitrageOpportunity[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1H');

  useEffect(() => {
    // Initialize mock data
    const mockMarketData: MarketData[] = [
      {
        symbol: 'ETH',
        price: 2340.50,
        change24h: 5.2,
        volume: 1250000000,
        marketCap: 281000000000,
        liquidity: 45000000,
        volatility: 12.3
      },
      {
        symbol: 'BTC',
        price: 43250.00,
        change24h: -2.1,
        volume: 890000000,
        marketCap: 847000000000,
        liquidity: 78000000,
        volatility: 8.7
      },
      {
        symbol: 'MATIC',
        price: 0.8420,
        change24h: 8.9,
        volume: 156000000,
        marketCap: 7800000000,
        liquidity: 12000000,
        volatility: 18.5
      }
    ];

    const mockArbitrageOps: ArbitrageOpportunity[] = [
      {
        pair: 'ETH/USDC',
        exchange1: 'Uniswap V3',
        exchange2: 'Curve',
        priceDiff: 2.34,
        profitPotential: 156.78,
        confidence: 94.2
      },
      {
        pair: 'BTC/USDC',
        exchange1: 'Balancer',
        exchange2: 'SushiSwap',
        priceDiff: 15.67,
        profitPotential: 423.45,
        confidence: 87.6
      }
    ];

    setMarketData(mockMarketData);
    setArbitrageOps(mockArbitrageOps);

    // Real-time updates
    const interval = setInterval(() => {
      setNetworkMetrics(prev => ({
        tps: 1200 + Math.random() * 300,
        gasPrice: 15 + Math.random() * 10,
        blockTime: 12 + Math.random() * 2,
        congestion: Math.random() * 100,
        activeChannels: 450 + Math.floor(Math.random() * 100),
        totalVolume: prev.totalVolume + Math.random() * 1000000
      }));

      setMarketData(prev => prev.map(item => ({
        ...item,
        price: item.price * (1 + (Math.random() - 0.5) * 0.02),
        change24h: item.change24h + (Math.random() - 0.5) * 0.5,
        volume: item.volume * (1 + (Math.random() - 0.5) * 0.1)
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            <Icons.Chart /> Real-Time Analytics
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '4px 0 0 0' }}>
            Live market data and network metrics
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['1H', '4H', '1D', '1W'].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              style={{
                background: selectedTimeframe === timeframe 
                  ? 'linear-gradient(135deg, #00d2d3, #54a0ff)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Network Health Dashboard */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          <Icons.Network /> Network Health
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '16px'
        }}>
          <div style={{
            background: 'rgba(0, 255, 136, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(0, 255, 136, 0.3)'
          }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>TPS</div>
            <div style={{ color: '#00ff88', fontSize: '24px', fontWeight: 'bold' }}>
              {networkMetrics.tps.toFixed(0)}
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px' }}>
              Transactions per second
            </div>
          </div>
          
          <div style={{
            background: 'rgba(84, 160, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(84, 160, 255, 0.3)'
          }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Gas Price</div>
            <div style={{ color: '#54a0ff', fontSize: '24px', fontWeight: 'bold' }}>
              {networkMetrics.gasPrice.toFixed(1)} gwei
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px' }}>
              Average gas price
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 193, 7, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 193, 7, 0.3)'
          }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Active Channels</div>
            <div style={{ color: '#ffc107', fontSize: '24px', fontWeight: 'bold' }}>
              {networkMetrics.activeChannels}
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px' }}>
              State channels open
            </div>
          </div>

          <div style={{
            background: 'rgba(156, 39, 176, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(156, 39, 176, 0.3)'
          }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Total Volume</div>
            <div style={{ color: '#9c27b0', fontSize: '24px', fontWeight: 'bold' }}>
              ${(networkMetrics.totalVolume / 1000000).toFixed(1)}M
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px' }}>
              24h trading volume
            </div>
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          <Icons.TrendingUp /> Market Overview
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {marketData.map((asset, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${
                    asset.symbol === 'ETH' ? '#627eea, #8a92b2' :
                    asset.symbol === 'BTC' ? '#f7931a, #ffb74d' :
                    '#8247e5, #b794f6'
                  })`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold'
                }}>
                  {asset.symbol.slice(0, 2)}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
                    {asset.symbol}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                    Vol: ${(asset.volume / 1000000).toFixed(0)}M
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>
                  ${asset.price.toLocaleString()}
                </div>
                <div style={{ 
                  color: asset.change24h >= 0 ? '#00ff88' : '#ff6b6b',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '10px' }}>Liquidity</div>
                  <div style={{ color: '#54a0ff', fontSize: '12px', fontWeight: 'bold' }}>
                    ${(asset.liquidity / 1000000).toFixed(1)}M
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '10px' }}>Volatility</div>
                  <div style={{ color: '#ffc107', fontSize: '12px', fontWeight: 'bold' }}>
                    {asset.volatility.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arbitrage Opportunities */}
      <div>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          <Icons.Zap /> Live Arbitrage Opportunities
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {arbitrageOps.map((op, index) => (
            <div key={index} style={{
              background: 'linear-gradient(135deg, rgba(0, 210, 211, 0.1), rgba(84, 160, 255, 0.1))',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(0, 210, 211, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: 'linear-gradient(135deg, #00ff88, #00d2d3)',
                color: '#000',
                padding: '4px 12px',
                borderRadius: '0 12px 0 12px',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                {op.confidence.toFixed(1)}% CONFIDENCE
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
                  {op.pair}
                </div>
                <div style={{ color: '#00ff88', fontSize: '18px', fontWeight: 'bold' }}>
                  +${op.profitPotential.toFixed(2)}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                  {op.exchange1} → {op.exchange2}
                </div>
                <div style={{ color: '#54a0ff', fontSize: '14px', fontWeight: 'bold' }}>
                  {op.priceDiff.toFixed(2)}% spread
                </div>
              </div>
              
              <div style={{
                marginTop: '8px',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${op.confidence}%`,
                  background: 'linear-gradient(90deg, #00ff88, #00d2d3)',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Chart Simulation */}
      <div style={{ 
        marginTop: '24px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ color: '#fff', fontSize: '14px', marginBottom: '12px' }}>
          <Icons.Activity /> Live Price Action
        </div>
        <div style={{ display: 'flex', gap: '2px', height: '60px', alignItems: 'end' }}>
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={i}
              style={{
                width: '4px',
                height: `${20 + Math.random() * 80}%`,
                background: Math.random() > 0.5 
                  ? 'linear-gradient(to top, #00ff88, #00d2d3)'
                  : 'linear-gradient(to top, #ff6b6b, #ee5a24)',
                borderRadius: '1px',
                animation: `pulse ${0.5 + Math.random()}s infinite alternate`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}