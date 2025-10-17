import { useState } from 'react';
import {
  LayoutDashboard,
  Upload,
  Monitor,
  Activity,
  TrendingUp,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TrainingUpload } from './TrainingUpload';
import { ScreenCapture } from './ScreenCapture';
import { ChartAnalysis } from './ChartAnalysis';
import { TradingSignals } from './TradingSignals';
import { Settings } from './Settings';

type Tab = 'overview' | 'training' | 'capture' | 'analysis' | 'signals' | 'settings';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: LayoutDashboard },
    { id: 'training' as Tab, label: 'Training', icon: Upload },
    { id: 'capture' as Tab, label: 'Capture', icon: Monitor },
    { id: 'analysis' as Tab, label: 'Analysis', icon: Activity },
    { id: 'signals' as Tab, label: 'Signals', icon: TrendingUp },
    { id: 'settings' as Tab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex h-screen">
        <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Activity className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Trading AI</h1>
                <p className="text-xs text-slate-400">Assistant</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-3 px-4 py-2">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-emerald-400">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Welcome to Trading AI</h2>
                  <p className="text-slate-400">
                    AI-powered chart analysis with automated market structure detection
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Upload className="text-blue-400" size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Training Materials</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">
                      Upload PDFs, videos, and documents to train the AI on your trading strategy
                    </p>
                    <button
                      onClick={() => setActiveTab('training')}
                      className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Upload Files
                    </button>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <Monitor className="text-emerald-400" size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Screen Capture</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">
                      Automatically capture TradingView charts every minute for analysis
                    </p>
                    <button
                      onClick={() => setActiveTab('capture')}
                      className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Start Capture
                    </button>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <TrendingUp className="text-purple-400" size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Trading Signals</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">
                      View AI-generated buy and sell signals with 5:1 risk/reward ratio
                    </p>
                    <button
                      onClick={() => setActiveTab('signals')}
                      className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      View Signals
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">How It Works</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-white font-bold">1</span>
                      </div>
                      <h4 className="font-semibold text-white mb-2">Train the AI</h4>
                      <p className="text-sm text-slate-400">
                        Upload your trading strategy materials to teach the AI your rules
                      </p>
                    </div>
                    <div>
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-white font-bold">2</span>
                      </div>
                      <h4 className="font-semibold text-white mb-2">Capture Charts</h4>
                      <p className="text-sm text-slate-400">
                        Enable auto-capture to monitor your TradingView 3-chart layout
                      </p>
                    </div>
                    <div>
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-white font-bold">3</span>
                      </div>
                      <h4 className="font-semibold text-white mb-2">AI Analysis</h4>
                      <p className="text-sm text-slate-400">
                        AI analyzes all timeframes for CHOCH, BOS, order blocks, and more
                      </p>
                    </div>
                    <div>
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-white font-bold">4</span>
                      </div>
                      <h4 className="font-semibold text-white mb-2">Get Signals</h4>
                      <p className="text-sm text-slate-400">
                        Receive alerts with entry, stop loss, and take profit levels
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'training' && <TrainingUpload />}
            {activeTab === 'capture' && <ScreenCapture />}
            {activeTab === 'analysis' && <ChartAnalysis />}
            {activeTab === 'signals' && <TradingSignals />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </main>
      </div>
    </div>
  );
}
