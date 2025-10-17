import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Signal {
  id: string;
  signal_type: 'buy' | 'sell';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_reward_ratio: number;
  confidence_score: number;
  status: 'pending' | 'active' | 'triggered' | 'expired' | 'cancelled';
  created_at: string;
  timeframe_4h_structure: string | null;
  timeframe_15m_action: string | null;
  timeframe_3m_orderblock: string | null;
  timeframe_1m_entry: string | null;
}

export function TradingSignals() {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadSignals();
    const subscription = supabase
      .channel('trading_signals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trading_signals',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          loadSignals();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadSignals = async () => {
    if (!user) return;

    let query = supabase
      .from('trading_signals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filter === 'active') {
      query = query.in('status', ['pending', 'active']);
    } else if (filter === 'completed') {
      query = query.in('status', ['triggered', 'expired', 'cancelled']);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error loading signals:', error);
      return;
    }

    setSignals(data || []);
  };

  useEffect(() => {
    loadSignals();
  }, [filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500/20 text-blue-400';
      case 'triggered':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'expired':
        return 'bg-slate-500/20 text-slate-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'triggered':
        return <CheckCircle size={16} />;
      case 'expired':
      case 'cancelled':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const calculateRisk = (signal: Signal) => {
    const risk = Math.abs(signal.entry_price - signal.stop_loss);
    return risk.toFixed(2);
  };

  const calculateReward = (signal: Signal) => {
    const reward = Math.abs(signal.take_profit - signal.entry_price);
    return reward.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Trading Signals</h2>
          <p className="text-slate-400">AI-generated buy and sell signals with 5:1 R/R</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {signals.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
            <TrendingUp className="mx-auto text-slate-600 mb-3" size={48} />
            <p className="text-slate-400">No signals yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Signals will appear here when conditions are met
            </p>
          </div>
        ) : (
          signals.map((signal) => (
            <div
              key={signal.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                      signal.signal_type === 'buy'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {signal.signal_type === 'buy' ? (
                      <TrendingUp size={24} />
                    ) : (
                      <TrendingDown size={24} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-white uppercase">
                        {signal.signal_type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(signal.status)}`}>
                        {getStatusIcon(signal.status)}
                        {signal.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      {new Date(signal.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400 mb-1">Confidence</p>
                  <p className="text-xl font-bold text-white">
                    {(signal.confidence_score * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Entry</p>
                  <p className="text-lg font-semibold text-white">
                    ${signal.entry_price.toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Stop Loss</p>
                  <p className="text-lg font-semibold text-red-400">
                    ${signal.stop_loss.toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Take Profit</p>
                  <p className="text-lg font-semibold text-emerald-400">
                    ${signal.take_profit.toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">R/R Ratio</p>
                  <p className="text-lg font-semibold text-blue-400">
                    {signal.risk_reward_ratio.toFixed(1)}:1
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 w-16">Risk:</span>
                  <span className="text-sm text-slate-300">${calculateRisk(signal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 w-16">Reward:</span>
                  <span className="text-sm text-slate-300">${calculateReward(signal)}</span>
                </div>
              </div>

              {(signal.timeframe_4h_structure ||
                signal.timeframe_15m_action ||
                signal.timeframe_3m_orderblock ||
                signal.timeframe_1m_entry) && (
                <details className="mt-4">
                  <summary className="text-sm font-medium text-slate-300 cursor-pointer hover:text-white transition-colors">
                    View Analysis Details
                  </summary>
                  <div className="mt-3 space-y-2 text-sm">
                    {signal.timeframe_4h_structure && (
                      <div>
                        <span className="font-medium text-emerald-400">4H Structure: </span>
                        <span className="text-slate-300">{signal.timeframe_4h_structure}</span>
                      </div>
                    )}
                    {signal.timeframe_15m_action && (
                      <div>
                        <span className="font-medium text-blue-400">15M Action: </span>
                        <span className="text-slate-300">{signal.timeframe_15m_action}</span>
                      </div>
                    )}
                    {signal.timeframe_3m_orderblock && (
                      <div>
                        <span className="font-medium text-yellow-400">3M Order Block: </span>
                        <span className="text-slate-300">{signal.timeframe_3m_orderblock}</span>
                      </div>
                    )}
                    {signal.timeframe_1m_entry && (
                      <div>
                        <span className="font-medium text-purple-400">1M Entry: </span>
                        <span className="text-slate-300">{signal.timeframe_1m_entry}</span>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
