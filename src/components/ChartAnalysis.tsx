import { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MarkerType {
  id: string;
  type: 'choch' | 'bos' | 'order_block' | 'liquidity' | 'poi' | 'fib_50';
  direction: 'bullish' | 'bearish' | 'neutral';
  price: number;
  confidence: number;
  timeframe: string;
}

export function ChartAnalysis() {
  const { user } = useAuth();
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'4h' | '15m' | '3m' | '1m'>('4h');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadMarkers();
  }, [selectedTimeframe]);

  const loadMarkers = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('market_structures')
      .select('*')
      .eq('user_id', user.id)
      .eq('timeframe', selectedTimeframe)
      .order('detected_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading markers:', error);
      return;
    }

    setMarkers(
      data.map((item) => ({
        id: item.id,
        type: item.structure_type,
        direction: item.direction,
        price: item.price_level,
        confidence: item.confidence,
        timeframe: item.timeframe,
      }))
    );
  };

  const getMarkerColor = (type: string, direction: string) => {
    if (direction === 'bullish') return 'text-emerald-400 bg-emerald-500/10';
    if (direction === 'bearish') return 'text-red-400 bg-red-500/10';
    return 'text-slate-400 bg-slate-500/10';
  };

  const getMarkerIcon = (direction: string) => {
    if (direction === 'bullish') return <TrendingUp size={16} />;
    if (direction === 'bearish') return <TrendingDown size={16} />;
    return <Minus size={16} />;
  };

  const getMarkerLabel = (type: string) => {
    const labels: Record<string, string> = {
      choch: 'CHOCH',
      bos: 'BOS',
      order_block: 'Order Block',
      liquidity: 'Liquidity',
      poi: 'POI',
      fib_50: 'Fib 50',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Market Structure Analysis</h2>
          <p className="text-slate-400">Detected patterns and key levels on charts</p>
        </div>
        <button
          onClick={() => setIsAnalyzing(true)}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-medium rounded-lg transition-all"
        >
          <Activity size={16} />
          {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-medium text-slate-400">Timeframe:</span>
          <div className="flex gap-2">
            {(['4h', '15m', '3m', '1m'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  selectedTimeframe === tf
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {markers.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto text-slate-600 mb-3" size={48} />
              <p className="text-slate-400">No market structures detected yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Capture charts to start analyzing
              </p>
            </div>
          ) : (
            markers.map((marker) => (
              <div
                key={marker.id}
                className="flex items-center gap-4 p-4 bg-slate-900 rounded-lg border border-slate-700"
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${getMarkerColor(
                    marker.type,
                    marker.direction
                  )}`}
                >
                  {getMarkerIcon(marker.direction)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">
                      {getMarkerLabel(marker.type)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        marker.direction === 'bullish'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : marker.direction === 'bearish'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {marker.direction}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>Price: ${marker.price.toFixed(2)}</span>
                    <span>Confidence: {(marker.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      marker.confidence >= 0.75
                        ? 'bg-emerald-500'
                        : marker.confidence >= 0.5
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${marker.confidence * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
