'use client';

import React, { useState, useEffect } from 'react';
import AITradingBot from '../components/AITradingBot';
import RealTimeAnalytics from '../components/RealTimeAnalytics';
import CrossChainBridge from '../components/CrossChainBridge';
import YellowNetworkIntegration from '../components/YellowNetworkIntegration';
import HackathonShowcase from '../components/HackathonShowcase';
import { TradingInterface } from '../components/trading/TradingInterface';
import { LPInterface } from '../components/lp/LPInterface';
import { WalletButton } from '../components/WalletButton';
import { Icons } from '../components/Icons';

interface TradeData {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  gasUsed: number;
  gasSaved: number;
}

interface ChannelMetrics {
  totalChannels: number;
  activeChannels: number;
  totalVolume: number;
  gasOptimization: number;
  avgResponseTime: number;
  successRate: number;
}

interface LPMetrics {
  totalLiquidity: number;
  apr: number;
  volume24h: number;
  fees24h: number;
  impermanentLoss: number;
  positions: number;
}

export default function PhotonXDemo() {
  const [activeMode, setActiveMode] = useState<'landing' | 'trading' | 'lp' | 'demo' | 'judge'>('landing');
  const [isJudgeMode, setIsJudgeMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [metrics, setMetrics] = useState<ChannelMetrics>({
    totalChannels: 1247,
    activeChannels: 89,
    totalVolume: 45600000,
    gasOptimization: 94.7,
    avgResponseTime: 156,
    successRate: 99.8
  });
  const [lpMetrics, setLpMetrics] = useState<LPMetrics>({
    totalLiquidity: 12500000,
    apr: 23.4,
    volume24h: 2340000,
    fees24h: 4680,
    impermanentLoss: -0.8,
    positions: 156
  });
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client side only
    setCurrentTime(new Date());
    
    // Check for judge mode in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('judge') === 'true') {
        setIsJudgeMode(true);
        setActiveMode('judge');
      }
    }

    // Initialize mock trades
    const mockTrades: TradeData[] = [
      {
        id: '0x1a2b3c4d',
        pair: 'ETH/USDC',
        side: 'buy',
        amount: 1.5,
        price: 2340.50,
        timestamp: new Date(Date.now() - 30000),
        status: 'completed',
        gasUsed: 21000,
        gasSaved: 450000
      },
      {
        id: '0x5e6f7g8h',
        pair: 'BTC/USDC',
        side: 'sell',
        amount: 0.1,
        price: 43250.00,
        timestamp: new Date(Date.now() - 60000),
        status: 'completed',
        gasUsed: 18500,
        gasSaved: 380000
      }
    ];
    setTrades(mockTrades);

    // Real-time updates
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalChannels: prev.totalChannels + Math.floor(Math.random() * 2),
        activeChannels: 85 + Math.floor(Math.random() * 10),
        totalVolume: prev.totalVolume + Math.random() * 50000,
        avgResponseTime: 150 + Math.random() * 20,
        gasOptimization: 92 + Math.random() * 6
      }));

      // Update LP metrics
      setLpMetrics(prev => ({
        ...prev,
        totalLiquidity: prev.totalLiquidity + Math.random() * 10000,
        volume24h: prev.volume24h + Math.random() * 5000,
        fees24h: prev.fees24h + Math.random() * 50
      }));

      // Add new trade occasionally
      if (Math.random() > 0.8) {
        const newTrade: TradeData = {
          id: `0x${Math.random().toString(16).slice(2, 10)}`,
          pair: ['ETH/USDC', 'BTC/USDC', 'MATIC/USDC'][Math.floor(Math.random() * 3)],
          side: Math.random() > 0.5 ? 'buy' : 'sell',
          amount: Math.random() * 5,
          price: 1000 + Math.random() * 50000,
          timestamp: new Date(),
          status: 'completed',
          gasUsed: 15000 + Math.random() * 10000,
          gasSaved: 300000 + Math.random() * 200000
        };
        setTrades(prev => [newTrade, ...prev.slice(0, 9)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleModeSwitch = (mode: 'landing' | 'trading' | 'lp' | 'demo' | 'judge') => {
    setActiveMode(mode);
    setIsMobileMenuOpen(false); // Close mobile menu when switching modes
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Navigation */}
      <nav style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }} className="responsive-nav">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo and Judge Mode Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{
              color: '#fff',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: 0,
              background: 'linear-gradient(45deg, #00d2d3, #54a0ff, #ffd700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ⚡ PhotonX
            </h1>
            {isJudgeMode && (
              <div style={{
                background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                color: '#000',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                animation: 'pulse 2s infinite',
                display: window.innerWidth > 768 ? 'block' : 'none'
              }}>
                🏆 JUDGE MODE
              </div>
            )}
          </div>
          
          {/* Desktop Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: '12px'
          }} className="hidden-mobile">
            {['landing', 'trading', 'lp', 'demo', 'judge'].map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeSwitch(mode as any)}
                style={{
                  background: activeMode === mode 
                    ? 'linear-gradient(135deg, #00d2d3, #54a0ff)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textTransform: 'capitalize',
                  transition: 'all 0.3s ease'
                }}
              >
                {mode === 'lp' ? 'LP Dashboard' : mode}
              </button>
            ))}
          </div>
          
          {/* Desktop Right Side */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px'
          }} className="hidden-mobile">
            <WalletButton />
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              🕐 {currentTime ? currentTime.toLocaleTimeString() : '--:--:--'}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="hidden-desktop">
            <WalletButton />
            <button
              onClick={toggleMobileMenu}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '18px',
                transition: 'all 0.3s ease'
              }}
              className="mobile-menu-toggle"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderTop: 'none',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 99
          }}>
            {['landing', 'trading', 'lp', 'demo', 'judge'].map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeSwitch(mode as any)}
                style={{
                  background: activeMode === mode 
                    ? 'linear-gradient(135deg, #00d2d3, #54a0ff)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textTransform: 'capitalize',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
              >
                {mode === 'lp' ? 'LP Dashboard' : mode}
              </button>
            ))}
            
            {isJudgeMode && (
              <div style={{
                background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                color: '#000',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginTop: '8px'
              }}>
                🏆 JUDGE MODE
              </div>
            )}
            
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: '14px',
              textAlign: 'center',
              marginTop: '12px',
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px'
            }}>
              🕐 {currentTime ? currentTime.toLocaleTimeString() : '--:--:--'}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main style={{ padding: '32px' }} className="responsive-padding">
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Landing Page */}
          {activeMode === 'landing' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '32px',
                padding: '64px 32px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                marginBottom: '48px'
              }} className="responsive-hero">
                <h1 style={{
                  color: '#fff',
                  fontSize: '56px',
                  fontWeight: 'bold',
                  margin: '0 0 24px 0',
                  background: 'linear-gradient(45deg, #00d2d3, #54a0ff, #ffd700, #ff6b6b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(0, 210, 211, 0.3)'
                }} className="responsive-text-lg">
                  Welcome to PhotonX
                </h1>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '24px',
                  margin: '0 0 32px 0',
                  maxWidth: '800px',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }} className="responsive-text-md">
                  Revolutionary DeFi trading platform powered by ERC-7824 state channels.
                  Experience gasless trading with sub-200ms quotes and 90%+ gas savings.
                </p>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '24px',
                  margin: '48px 0'
                }} className="responsive-grid">
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 210, 211, 0.1), rgba(84, 160, 255, 0.1))',
                    borderRadius: '20px',
                    padding: '32px',
                    border: '1px solid rgba(0, 210, 211, 0.3)'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
                    <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                      Lightning Fast
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', margin: 0 }}>
                      Sub-200ms quote generation using advanced state channel technology
                    </p>
                  </div>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(238, 90, 36, 0.1))',
                    borderRadius: '20px',
                    padding: '32px',
                    border: '1px solid rgba(255, 107, 107, 0.3)'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
                    <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                      Gas Optimized
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', margin: 0 }}>
                      Save 90%+ on gas fees with intelligent batch settlement
                    </p>
                  </div>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 237, 78, 0.1))',
                    borderRadius: '20px',
                    padding: '32px',
                    border: '1px solid rgba(255, 215, 0, 0.3)'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌍</div>
                    <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                      Cross-Chain
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', margin: 0 }}>
                      Seamless trading across Ethereum, Polygon, Base, and Arbitrum
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setActiveMode('demo')}
                  style={{
                    background: 'linear-gradient(135deg, #00d2d3, #54a0ff)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '20px 48px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(0, 210, 211, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  className="responsive-button"
                >
                  🚀 Launch Demo
                </button>
              </div>
            </div>
          )}

          {/* Demo Mode */}
          {activeMode === 'demo' && (
            <div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                marginBottom: '24px'
              }}>
                <h2 style={{ color: '#fff', fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>
                  🚀 Live PhotonX Demo
                </h2>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                  marginBottom: '32px'
                }} className="responsive-grid">
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 210, 211, 0.1))',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Total Channels</div>
                    <div style={{ color: '#00ff88', fontSize: '32px', fontWeight: 'bold' }}>
                      {metrics.totalChannels.toLocaleString()}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                      {metrics.activeChannels} active
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(84, 160, 255, 0.1), rgba(102, 126, 234, 0.1))',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(84, 160, 255, 0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Gas Optimization</div>
                    <div style={{ color: '#54a0ff', fontSize: '32px', fontWeight: 'bold' }}>
                      {metrics.gasOptimization.toFixed(1)}%
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                      vs traditional DEX
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1))',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Avg Response</div>
                    <div style={{ color: '#ffc107', fontSize: '32px', fontWeight: 'bold' }}>
                      {metrics.avgResponseTime.toFixed(0)}ms
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                      quote generation
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1), rgba(233, 30, 99, 0.1))',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(156, 39, 176, 0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Success Rate</div>
                    <div style={{ color: '#9c27b0', fontSize: '32px', fontWeight: 'bold' }}>
                      {metrics.successRate.toFixed(1)}%
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                      settlement success
                    </div>
                  </div>
                </div>
              </div>
              
              {/* AI Trading Bot */}
              <div style={{ marginBottom: '24px' }}>
                <AITradingBot />
              </div>
              
              {/* Real-Time Analytics */}
              <div style={{ marginBottom: '24px' }}>
                <RealTimeAnalytics />
              </div>
              
              {/* Cross-Chain Bridge */}
              <div style={{ marginBottom: '24px' }}>
                <CrossChainBridge />
              </div>
              
              {/* Yellow Network Integration */}
              <div style={{ marginBottom: '24px' }}>
                <YellowNetworkIntegration />
              </div>
            </div>
          )}

          {/* Trading Interface */}
          {activeMode === 'trading' && (
            <div>
              <TradingInterface />
            </div>
          )}

          {/* LP Dashboard */}
          {activeMode === 'lp' && (
            <div>
              <LPInterface />
            </div>
          )}

          {/* Judge Mode */}
          {activeMode === 'judge' && (
            <div>
              {/* Hackathon Showcase */}
              <div style={{ marginBottom: '32px' }}>
                <HackathonShowcase />
              </div>
              
              {/* Yellow Network Integration */}
              <div style={{ marginBottom: '32px' }}>
                <YellowNetworkIntegration />
              </div>
              
              {/* All Demo Components */}
              <div style={{ marginBottom: '24px' }}>
                <AITradingBot />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <RealTimeAnalytics />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <CrossChainBridge />
              </div>
              

            </div>
          )}
        </div>
      </main>
    </div>
  );
}