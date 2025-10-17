interface MarketStructure {
  type: 'choch' | 'bos' | 'order_block' | 'liquidity' | 'poi' | 'fib_50';
  direction: 'bullish' | 'bearish' | 'neutral';
  priceLevel: number;
  confidence: number;
  coordinates: { x: number; y: number; width: number; height: number };
}

interface ChartAnalysis {
  timeframe: '4h' | '15m' | '3m' | '1m';
  structures: MarketStructure[];
  trendDirection: 'bullish' | 'bearish' | 'neutral';
  keyLevels: number[];
  analysis: string;
}

interface TradingSignal {
  signalType: 'buy' | 'sell' | null;
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: number | null;
  confidence: number;
  reasoning: {
    tf4h: string;
    tf15m: string;
    tf3m: string;
    tf1m: string;
  };
}

export class OpenAIAnalyzer {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeChart(imageBase64: string, timeframe: string): Promise<ChartAnalysis> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an expert trading chart analyst specializing in market structure analysis.
              Analyze the chart and identify:
              - CHOCH (Change of Character): When price breaks previous structure creating new highs/lows
              - BOS (Break of Structure): Strong directional moves breaking key levels
              - Order Blocks: Areas where institutions placed large orders (demand/supply zones)
              - Liquidity: Areas with stop loss clusters (liquidity pools)
              - POI (Points of Interest): Key decision points where price might react
              - Fibonacci 50: Mid-point retracement levels

              Return detailed analysis with specific price levels and confidence scores.`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this ${timeframe} trading chart. Identify all market structures, trend direction, and key price levels. Provide coordinates for marking structures on the chart.`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const analysis = this.parseAnalysis(data.choices[0].message.content, timeframe);
      return analysis;
    } catch (error) {
      console.error('Chart analysis error:', error);
      throw error;
    }
  }

  async generateSignal(
    tf4h: ChartAnalysis,
    tf15m: ChartAnalysis,
    tf3m: ChartAnalysis,
    tf1m: ChartAnalysis,
    trainingRules: string[]
  ): Promise<TradingSignal> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a professional trading signal generator. Use multi-timeframe analysis to generate high-probability trading signals.

              Trading Rules:
              ${trainingRules.join('\n')}

              Signal Logic:
              1. 4H chart: Identify overall market structure and trend
              2. 15M chart: Find market action and intermediate structure
              3. 3M chart: Locate order blocks for entry zones
              4. 1M chart: Find precise entry trigger

              Only generate a signal if ALL timeframes align. Calculate 5:1 risk/reward ratio.`,
            },
            {
              role: 'user',
              content: `Analyze these multi-timeframe charts and generate a trading signal:

              4H: ${JSON.stringify(tf4h)}
              15M: ${JSON.stringify(tf15m)}
              3M: ${JSON.stringify(tf3m)}
              1M: ${JSON.stringify(tf1m)}

              Generate a signal only if all timeframes align. Include entry, stop loss, and take profit with 5:1 RR.`,
            },
          ],
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const signal = this.parseSignal(data.choices[0].message.content);
      return signal;
    } catch (error) {
      console.error('Signal generation error:', error);
      throw error;
    }
  }

  async extractTrainingContent(fileUrl: string, fileType: string): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a trading strategy extractor. Analyze the provided material and extract:
              - Trading rules and entry criteria
              - Market structure patterns to look for
              - Risk management rules
              - Exit strategies
              - Any specific indicators or timeframes mentioned

              Be specific and detailed in your extraction.`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all trading rules and strategies from this material.',
                },
                fileType.startsWith('image/') || fileType.includes('pdf')
                  ? {
                      type: 'image_url',
                      image_url: {
                        url: fileUrl,
                      },
                    }
                  : {
                      type: 'text',
                      text: `File URL: ${fileUrl} (Type: ${fileType})`,
                    },
              ],
            },
          ],
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Content extraction error:', error);
      throw error;
    }
  }

  private parseAnalysis(content: string, timeframe: string): ChartAnalysis {
    return {
      timeframe: timeframe as '4h' | '15m' | '3m' | '1m',
      structures: [],
      trendDirection: 'neutral',
      keyLevels: [],
      analysis: content,
    };
  }

  private parseSignal(content: string): TradingSignal {
    return {
      signalType: null,
      entryPrice: null,
      stopLoss: null,
      takeProfit: null,
      riskRewardRatio: null,
      confidence: 0,
      reasoning: {
        tf4h: '',
        tf15m: '',
        tf3m: '',
        tf1m: '',
      },
    };
  }
}
