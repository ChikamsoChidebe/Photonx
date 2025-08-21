'use client';

import { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface PredictionData {
  symbol: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  timeframe: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  signals: string[];
}

interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  performance: number;
  trades: number;
  winRate: number;
  active: boolean;
}

export default function AITradingBot() {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [botActive, setBotActive] = useState(false);
  const [performance, setPerformance] = useState({ pnl: 0, trades: 0, winRate: 0 });

  useEffect(() => {
    // Simulate AI predictions
    const mockPredictions: PredictionData[] = [
      {
        symbol: 'ETH/USDC',
        currentPrice: 2340.50,
        predictedPrice: 2485.20,
        confidence: 87.3,
        timeframe: '4h',
        trend: 'bullish',
        signals: ['RSI Oversold Recovery', 'Volume Surge', 'Whale Accumulation']
      },
      {
        symbol: 'BTC/USDC',
        currentPrice: 43250.00,
        predictedPrice: 44890.00,
        confidence: 92.1,
        timeframe: '6h',
        trend: 'bullish',
        signals: ['Golden Cross', 'Support Bounce', 'Institutional Flow']
      },
      {
        symbol: 'MATIC/USDC',
        currentPrice: 0.8420,
        predictedPrice: 0.7890,
        confidence: 78.5,
        timeframe: '2h',
        trend: 'bearish',
        signals: ['Resistance Rejection', 'Bearish Divergence']
      }
    ];

    const mockStrategies: TradingStrategy[] = [
      {
        id: '1',
        name: 'Neural Momentum',
        description: 'Deep learning model analyzing price momentum and volume patterns',
        performance: 23.4,
        trades: 156,
        winRate: 68.2,
        active: true
      },
      {
        id: '2',
        name: 'Sentiment Arbitrage',
        description: 'Social sentiment analysis combined with technical indicators',
        performance: 18.7,
        trades: 89,
        winRate: 71.9,
        active: false
      },
      {
        id: '3',
        name: 'Cross-Chain Alpha',
        description: 'Multi-chain arbitrage opportunities using state channels',
        performance: 31.2,
        trades: 203,
        winRate: 74.1,
        active: true
      }
    ];

    setPredictions(mockPredictions);
    setStrategies(mockStrategies);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setPerformance(prev => ({
        pnl: prev.pnl + (Math.random() - 0.4) * 50,
        trades: prev.trades + (Math.random() > 0.7 ? 1 : 0),
        winRate: 65 + Math.random() * 15
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }} className="ai-bot-header">
        <div>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            <Icons.Robot /> AI Trading Bot
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '4px 0 0 0' }}>
            Neural network-powered automated trading
          </p>
        </div>
        <button
          onClick={() => setBotActive(!botActive)}
          style={{
            background: botActive 
              ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' 
              : 'linear-gradient(135deg, #00d2d3, #54a0ff)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {botActive ? <><Icons.Pause /> Stop Bot</> : <><Icons.Play /> Start Bot</>}
        </button>
      </div>

      {/* Performance Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }} className="performance-grid">
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Total P&L</div>
          <div style={{ 
            color: performance.pnl >= 0 ? '#00ff88' : '#ff6b6b', 
            fontSize: '24px', 
            fontWeight: 'bold' 
          }}>
            {performance.pnl >= 0 ? '+' : ''}${performance.pnl.toFixed(2)}
          </div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Total Trades</div>
          <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
            {performance.trades}
          </div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Win Rate</div>
          <div style={{ color: '#00ff88', fontSize: '24px', fontWeight: 'bold' }}>
            {performance.winRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* AI Predictions */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          <Icons.Brain /> AI Market Predictions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {predictions.map((pred, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>{pred.symbol}</div>
                <div style={{
                  background: pred.trend === 'bullish' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                  color: pred.trend === 'bullish' ? '#00ff88' : '#ff6b6b',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {pred.trend.toUpperCase()}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Current: ${pred.currentPrice.toLocaleString()}
                </span>
                <span style={{ color: '#fff' }}>
                  Target: ${pred.predictedPrice.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                  Confidence: {pred.confidence}% | {pred.timeframe}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {pred.signals.slice(0, 2).map((signal, i) => (
                    <span key={i} style={{
                      background: 'rgba(84, 160, 255, 0.2)',
                      color: '#54a0ff',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px'
                    }}>
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trading Strategies */}
      <div>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          <Icons.Zap /> Active Strategies
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {strategies.map((strategy) => (
            <div key={strategy.id} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              opacity: strategy.active ? 1 : 0.6
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>{strategy.name}</div>
                <div style={{
                  background: strategy.active ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  color: strategy.active ? '#00ff88' : 'rgba(255, 255, 255, 0.7)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {strategy.active ? 'ACTIVE' : 'PAUSED'}
                </div>
              </div>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', margin: '0 0 12px 0' }}>
                {strategy.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#00ff88' }}>
                  Performance: +{strategy.performance}%
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {strategy.trades} trades | {strategy.winRate}% win rate
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Neural Network Visualization */}
      <div style={{ 
        marginTop: '24px', 
        padding: '16px', 
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ color: '#fff', fontSize: '14px', marginBottom: '8px' }}>
          <Icons.Activity /> Neural Network Activity
        </div>
        <div style={{ display: 'flex', gap: '4px', height: '40px', alignItems: 'end' }}>
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: `${Math.random() * 100}%`,
                background: `linear-gradient(to top, #54a0ff, #00d2d3)`,
                borderRadius: '2px',
                animation: `pulse ${1 + Math.random()}s infinite alternate`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}