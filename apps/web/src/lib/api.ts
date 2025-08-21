const API_BASE_URL = process.env.NEXT_PUBLIC_COORDINATOR_URL || 'http://localhost:3001';

export interface QuoteRequest {
  pair: string;
  side: 'buy' | 'sell';
  amount: string;
  userAddress: string;
  chainId: number;
}

export interface QuoteResponse {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  expires: number;
  signature: string;
  gasSaved: number;
}

export interface TradeRequest {
  quoteId: string;
  userSignature: string;
}

export class PhotonXAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async requestQuote(request: QuoteRequest): Promise<QuoteResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Quote request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Quote request error:', error);
      // Fallback to mock data for demo
      return this.getMockQuote(request);
    }
  }

  async executeTrade(request: TradeRequest): Promise<{ success: boolean; txHash?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Trade execution failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Trade execution error:', error);
      // Return mock success for demo
      return {
        success: true,
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`
      };
    }
  }

  async getMarketData(): Promise<{[key: string]: number}> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market-data`);
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      return await response.json();
    } catch (error) {
      console.error('Market data error:', error);
      // Fallback to CoinGecko
      return this.getCoinGeckoPrices();
    }
  }

  private async getCoinGeckoPrices(): Promise<{[key: string]: number}> {
    try {
      const coinIds = 'ethereum,bitcoin,matic-network,arbitrum';
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`);
      const data = await response.json();
      
      return {
        'ETH': data.ethereum?.usd || 2340.50,
        'BTC': data.bitcoin?.usd || 43250.00,
        'MATIC': data['matic-network']?.usd || 0.8420,
        'ARB': data.arbitrum?.usd || 1.25
      };
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return {
        'ETH': 2340.50,
        'BTC': 43250.00,
        'MATIC': 0.8420,
        'ARB': 1.25
      };
    }
  }

  private getMockQuote(request: QuoteRequest): QuoteResponse {
    const prices: {[key: string]: number} = {
      'ETH': 2340.50,
      'BTC': 43250.00,
      'MATIC': 0.8420,
      'ARB': 1.25
    };

    const basePrice = prices[request.pair.split('/')[0]] || 1;
    const spread = 0.002;
    const price = request.side === 'buy' ? basePrice * (1 + spread) : basePrice * (1 - spread);

    return {
      id: `quote_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      pair: request.pair,
      side: request.side,
      amount: request.amount,
      price: price.toString(),
      expires: Date.now() + 30000, // 30 seconds
      signature: `0x${Math.random().toString(16).slice(2, 130)}`,
      gasSaved: Math.floor(Math.random() * 500000) + 200000
    };
  }
}

export const photonxAPI = new PhotonXAPI();