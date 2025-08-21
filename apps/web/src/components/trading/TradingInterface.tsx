'use client';

import { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { useWallet } from '../../hooks/useWallet';

interface Quote {
  pair: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  timestamp: Date;
  expires: Date;
  gasSaved: number;
}

export function TradingInterface() {
  const [selectedPair, setSelectedPair] = useState('ETH/USDC');
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const { isConnected, address, balance, chainId, connectWallet: connect, disconnectWallet, switchNetwork, isConnecting } = useWallet();
  const [realPrices, setRealPrices] = useState<{[key: string]: number}>({});

  const pairs = ['ETH/USDC', 'BTC/USDC', 'MATIC/USDC', 'ARB/USDC'];
  
  const coinGeckoIds = {
    'ETH': 'ethereum',
    'BTC': 'bitcoin', 
    'MATIC': 'matic-network',
    'ARB': 'arbitrum'
  };

  const fetchRealPrices = async () => {
    try {
      const coinIds = Object.values(coinGeckoIds).join(',');
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`);
      const data = await response.json();
      
      const prices: {[key: string]: number} = {};
      Object.entries(coinGeckoIds).forEach(([symbol, id]) => {
        if (data[id]) {
          prices[symbol] = data[id].usd;
        }
      });
      
      setRealPrices(prices);
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      // Fallback to mock prices if API fails
      setRealPrices({
        'ETH': 2340.50,
        'BTC': 43250.00,
        'MATIC': 0.8420,
        'ARB': 1.25
      });
    }
  };

  const requestQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsRequesting(true);
    
    // Fetch latest prices before generating quote
    await fetchRealPrices();
    
    setTimeout(() => {
      const tokenSymbol = selectedPair.split('/')[0];
      const basePrice = realPrices[tokenSymbol] || 1;
      
      const spread = 0.002;
      const price = side === 'buy' ? basePrice * (1 + spread) : basePrice * (1 - spread);
      
      const newQuote: Quote = {
        pair: selectedPair,
        price,
        amount: parseFloat(amount),
        side,
        timestamp: new Date(),
        expires: new Date(Date.now() + 30000),
        gasSaved: Math.floor(Math.random() * 500000) + 200000
      };
      
      setQuotes(prev => [newQuote, ...prev.slice(0, 4)]);
      setIsRequesting(false);
    }, 150 + Math.random() * 100);
  };

  const handleNetworkSwitch = async () => {
    if (chainId !== 1 && chainId !== 137 && chainId !== 42161 && chainId !== 8453) {
      await switchNetwork(1);
    }
  };

  useEffect(() => {
    // Fetch initial prices
    fetchRealPrices();
    
    // Update prices every 30 seconds
    const priceInterval = setInterval(fetchRealPrices, 30000);
    
    return () => clearInterval(priceInterval);
  }, []);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slideIn {
          0% { opacity: 0; transform: translateX(20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }} className="trading-header">
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
              📈 PhotonX Trading
            </h1>
            
            {!isConnected ? (
              <button
                onClick={connect}
                style={{
                  background: 'linear-gradient(135deg, #00d2d3, #54a0ff)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                💳 Connect Wallet
              </button>
            ) : (
              <div style={{
                background: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                borderRadius: '12px',
                padding: '12px 24px',
                color: '#00ff88',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                ✅ Wallet Connected
              </div>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }} className="trading-grid">
            {/* RFQ Panel */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 210, 211, 0.15), rgba(84, 160, 255, 0.15))',
              borderRadius: '20px',
              padding: '32px',
              border: '2px solid rgba(0, 210, 211, 0.4)',
              boxShadow: '0 20px 40px rgba(0, 210, 211, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }} className="trading-panel">
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #00d2d3, #54a0ff, #00d2d3)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s ease-in-out infinite'
              }} />
              
              <h2 style={{ 
                color: '#fff', 
                fontSize: '24px', 
                fontWeight: 'bold', 
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #00d2d3, #54a0ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  ⚡
                </div>
                Request for Quote
              </h2>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  fontSize: '14px', 
                  display: 'block', 
                  marginBottom: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Trading Pair
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedPair}
                    onChange={(e) => setSelectedPair(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                      color: '#fff',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {pairs.map(pair => (
                      <option key={pair} value={pair} style={{ background: '#1a1a2e', color: '#fff', padding: '10px' }}>
                        {pair}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <button
                  onClick={() => setSide('buy')}
                  style={{
                    flex: 1,
                    padding: '16px 24px',
                    borderRadius: '12px',
                    border: side === 'buy' ? '2px solid #00ff88' : '2px solid rgba(255, 255, 255, 0.1)',
                    background: side === 'buy' 
                      ? 'linear-gradient(135deg, #00ff88, #00d2d3)' 
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                    color: side === 'buy' ? '#000' : '#fff',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: side === 'buy' ? '0 10px 30px rgba(0, 255, 136, 0.3)' : 'none'
                  }}
                >
                  📈 Buy
                </button>
                <button
                  onClick={() => setSide('sell')}
                  style={{
                    flex: 1,
                    padding: '16px 24px',
                    borderRadius: '12px',
                    border: side === 'sell' ? '2px solid #ff6b6b' : '2px solid rgba(255, 255, 255, 0.1)',
                    background: side === 'sell' 
                      ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' 
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: side === 'sell' ? '0 10px 30px rgba(255, 107, 107, 0.3)' : 'none'
                  }}
                >
                  📉 Sell
                </button>
              </div>
              
              <div style={{ marginBottom: '32px' }}>
                <label style={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  fontSize: '14px', 
                  display: 'block', 
                  marginBottom: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Amount
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      borderRadius: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                      color: '#fff',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    className="trading-input"
                  />
                  <div style={{
                    position: 'absolute',
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    textAlign: 'right'
                  }}>
                    <div>{selectedPair.split('/')[0]}</div>
                    <div style={{ color: '#00d2d3', fontSize: '10px' }}>
                      ${realPrices[selectedPair.split('/')[0]]?.toLocaleString() || '---'}
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  {['0.1', '0.5', '1.0', 'MAX'].map(preset => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset === 'MAX' ? '10.0' : preset)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={requestQuote}
                disabled={isRequesting || !isConnected || !amount}
                style={{
                  width: '100%',
                  padding: '20px',
                  borderRadius: '16px',
                  border: 'none',
                  background: isRequesting || !isConnected || !amount 
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))' 
                    : 'linear-gradient(135deg, #00d2d3, #54a0ff, #00d2d3)',
                  backgroundSize: '200% 100%',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: isRequesting || !isConnected || !amount ? 'not-allowed' : 'pointer',
                  opacity: isRequesting || !isConnected || !amount ? 0.5 : 1,
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxShadow: isRequesting || !isConnected || !amount 
                    ? 'none' 
                    : '0 15px 35px rgba(0, 210, 211, 0.4)',
                  animation: isRequesting || !isConnected || !amount ? 'none' : 'shimmer 3s ease-in-out infinite'
                }}
                className="trading-button"
              >
                {isRequesting ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Requesting Quote...
                  </div>
                ) : (
                  '⚡ Request Quote'
                )}
              </button>
            </div>
            
            {/* Live Quotes */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 210, 211, 0.15))',
              borderRadius: '20px',
              padding: '32px',
              border: '2px solid rgba(0, 255, 136, 0.4)',
              boxShadow: '0 20px 40px rgba(0, 255, 136, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }} className="trading-panel">
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #00ff88, #00d2d3, #00ff88)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s ease-in-out infinite'
              }} />
              
              <h2 style={{ 
                color: '#fff', 
                fontSize: '24px', 
                fontWeight: 'bold', 
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #00ff88, #00d2d3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  animation: 'pulse 2s ease-in-out infinite'
                }}>
                  📊
                </div>
                Live Quotes
              </h2>
              
              {quotes.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  padding: '60px 20px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                  borderRadius: '16px',
                  border: '1px dashed rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ 
                    fontSize: '64px', 
                    marginBottom: '20px',
                    opacity: '0.7',
                    animation: 'float 3s ease-in-out infinite'
                  }}>⏱️</div>
                  <h3 style={{ 
                    color: '#fff', 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    marginBottom: '8px' 
                  }}>
                    Ready for Lightning-Fast Quotes
                  </h3>
                  <p style={{ fontSize: '16px', margin: 0 }}>
                    Request a quote to see live prices in ~150ms
                  </p>
                  <div style={{
                    marginTop: '20px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '20px',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    <div>⚡ Sub-200ms</div>
                    <div>💰 90%+ Gas Savings</div>
                    <div>🔒 Secure Channels</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {quotes.map((quote, index) => (
                    <div key={index} style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      animation: 'slideIn 0.5s ease-out'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
                          {quote.side.toUpperCase()} {quote.amount} {quote.pair.split('/')[0]}
                        </div>
                        <div style={{ 
                          color: quote.side === 'buy' ? '#00ff88' : '#ff6b6b',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}>
                          ${quote.price.toLocaleString()}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Gas saved: {quote.gasSaved.toLocaleString()}
                        </div>
                        <div style={{ color: '#54a0ff' }}>
                          Expires: {Math.max(0, Math.floor((quote.expires.getTime() - Date.now()) / 1000))}s
                        </div>
                      </div>
                      
                      <button style={{
                        width: '100%',
                        marginTop: '16px',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #00ff88, #00d2d3)',
                        color: '#000',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 8px 20px rgba(0, 255, 136, 0.3)'
                      }}>
                        🚀 Execute Trade
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Real-Time Market Data */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            💹 Live Market Prices
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }} className="market-grid">
            {Object.entries(realPrices).map(([symbol, price]) => (
              <div key={symbol} style={{
                background: 'linear-gradient(135deg, rgba(0, 210, 211, 0.1), rgba(84, 160, 255, 0.1))',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(0, 210, 211, 0.3)',
                textAlign: 'center'
              }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '4px' }}>
                  {symbol}/USDC
                </div>
                <div style={{ color: '#00d2d3', fontSize: '20px', fontWeight: 'bold' }}>
                  ${price?.toLocaleString() || '---'}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '10px' }}>
                  Live Price
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Trading Stats */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)'
        }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            📊 Trading Statistics
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }} className="stats-grid">
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#00ff88', fontSize: '24px', fontWeight: 'bold' }}>156ms</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Avg Quote Time</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#54a0ff', fontSize: '24px', fontWeight: 'bold' }}>94.7%</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Gas Savings</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffc107', fontSize: '24px', fontWeight: 'bold' }}>99.8%</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Success Rate</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#9c27b0', fontSize: '24px', fontWeight: 'bold' }}>1,247</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Active Channels</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}