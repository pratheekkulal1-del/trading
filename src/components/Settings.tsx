import { useState, useEffect } from 'react';
import { Save, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function Settings() {
  const { user } = useAuth();
  const [openaiKey, setOpenaiKey] = useState('');
  const [captureInterval, setCaptureInterval] = useState(60);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.75);
  const [riskRewardRatio, setRiskRewardRatio] = useState(5.0);
  const [alertSound, setAlertSound] = useState(true);
  const [alertToast, setAlertToast] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading settings:', error);
      return;
    }

    if (data) {
      setOpenaiKey(data.openai_api_key || '');
      setCaptureInterval(data.capture_interval_seconds);
      setConfidenceThreshold(data.min_confidence_threshold);
      setRiskRewardRatio(data.risk_reward_ratio);
      setAlertSound(data.alert_sound_enabled);
      setAlertToast(data.alert_toast_enabled);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const settingsData = {
        user_id: user.id,
        openai_api_key: openaiKey,
        capture_interval_seconds: captureInterval,
        min_confidence_threshold: confidenceThreshold,
        risk_reward_ratio: riskRewardRatio,
        alert_sound_enabled: alertSound,
        alert_toast_enabled: alertToast,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from('user_settings')
          .update(settingsData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_settings')
          .insert(settingsData);

        if (error) throw error;
      }

      setMessage('Settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
        <p className="text-slate-400">Configure your trading AI preferences</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
        <div>
          <label htmlFor="openai-key" className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Key size={16} />
            OpenAI API Key
          </label>
          <input
            id="openai-key"
            type="password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Required for chart analysis. Get your API key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              OpenAI
            </a>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="capture-interval" className="block text-sm font-medium text-slate-300 mb-2">
              Capture Interval (seconds)
            </label>
            <input
              id="capture-interval"
              type="number"
              min="10"
              max="300"
              value={captureInterval}
              onChange={(e) => setCaptureInterval(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-slate-500 mt-1">How often to capture charts</p>
          </div>

          <div>
            <label htmlFor="confidence-threshold" className="block text-sm font-medium text-slate-300 mb-2">
              Minimum Confidence (0-1)
            </label>
            <input
              id="confidence-threshold"
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-slate-500 mt-1">Minimum confidence to trigger signals</p>
          </div>

          <div>
            <label htmlFor="risk-reward" className="block text-sm font-medium text-slate-300 mb-2">
              Risk/Reward Ratio
            </label>
            <input
              id="risk-reward"
              type="number"
              min="1"
              max="10"
              step="0.5"
              value={riskRewardRatio}
              onChange={(e) => setRiskRewardRatio(parseFloat(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-slate-500 mt-1">Target risk/reward ratio</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={alertSound}
              onChange={(e) => setAlertSound(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
            />
            <div>
              <span className="text-sm font-medium text-slate-300">Sound Alerts</span>
              <p className="text-xs text-slate-500">Play sound when signals are generated</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={alertToast}
              onChange={(e) => setAlertToast(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
            />
            <div>
              <span className="text-sm font-medium text-slate-300">Toast Notifications</span>
              <p className="text-xs text-slate-500">Show popup notifications for new signals</p>
            </div>
          </label>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg ${
              message.includes('Error')
                ? 'bg-red-500/10 border border-red-500/50 text-red-400'
                : 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400'
            }`}
          >
            <p className="text-sm">{message}</p>
          </div>
        )}

        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-medium rounded-lg transition-all"
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
