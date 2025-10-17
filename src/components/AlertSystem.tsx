import { useEffect, useState } from 'react';
import { X, Bell, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Toast {
  id: string;
  type: 'buy' | 'sell';
  message: string;
  price: number;
  confidence: number;
}

export function AlertSystem() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('signal_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trading_signals',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const signal = payload.new;
          if (!signal.alert_sent) {
            showAlert(signal);
          }
        }
      )
      .subscribe();

    requestNotificationPermission();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const playAlertSound = () => {
    if (!soundEnabled) return;

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const showAlert = (signal: any) => {
    const toast: Toast = {
      id: signal.id,
      type: signal.signal_type,
      message: `${signal.signal_type.toUpperCase()} Signal at $${signal.entry_price.toFixed(2)}`,
      price: signal.entry_price,
      confidence: signal.confidence_score,
    };

    if (notificationsEnabled) {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        removeToast(toast.id);
      }, 10000);
    }

    if (soundEnabled) {
      playAlertSound();
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Trading Signal Alert', {
        body: toast.message,
        icon: '/icon.png',
        badge: '/icon.png',
        tag: toast.id,
        requireInteraction: false,
      });
    }

    supabase
      .from('trading_signals')
      .update({ alert_sent: true })
      .eq('id', signal.id)
      .then();
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-sm animate-slide-in ${
              toast.type === 'buy'
                ? 'bg-emerald-900/90 border-emerald-500'
                : 'bg-red-900/90 border-red-500'
            }`}
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                toast.type === 'buy' ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            >
              <Bell className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white mb-1">{toast.message}</p>
              <p className="text-xs text-white/80">
                Confidence: {(toast.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="text-white" size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button
          onClick={toggleSound}
          className={`p-3 rounded-xl shadow-lg border transition-all ${
            soundEnabled
              ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
          }`}
          title={soundEnabled ? 'Mute alerts' : 'Unmute alerts'}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
        <button
          onClick={toggleNotifications}
          className={`p-3 rounded-xl shadow-lg border transition-all ${
            notificationsEnabled
              ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
          }`}
          title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
        >
          <Bell size={20} />
        </button>
      </div>
    </>
  );
}
