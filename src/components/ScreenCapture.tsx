import { useState, useRef, useEffect } from 'react';
import { Monitor, Square, Play, Pause, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface CaptureSettings {
  intervalSeconds: number;
  autoCapture: boolean;
}

export function ScreenCapture() {
  const { user } = useAuth();
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [settings, setSettings] = useState<CaptureSettings>({
    intervalSeconds: 60,
    autoCapture: false,
  });
  const [lastCapture, setLastCapture] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [stream]);

  const startCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      setStream(mediaStream);

      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopCapture();
      });

      setIsCapturing(true);

      if (settings.autoCapture) {
        intervalRef.current = window.setInterval(() => {
          captureFrame();
        }, settings.intervalSeconds * 1000);
      }
    } catch (error) {
      console.error('Error starting capture:', error);
      alert('Failed to start screen capture. Please ensure you granted permission.');
    }
  };

  const stopCapture = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsCapturing(false);
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !user || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        const timestamp = new Date().toISOString();
        const fileName = `capture-${timestamp}.png`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chart-captures')
          .upload(filePath, blob, {
            contentType: 'image/png',
            cacheControl: '3600',
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('chart-captures')
          .getPublicUrl(filePath);

        if (!data || !data.publicUrl) {
            throw new Error('Failed to get public URL');
        }
        const publicUrl = data.publicUrl;


        const { error: dbError } = await supabase.from('chart_captures').insert({
          user_id: user.id,
          capture_url: publicUrl,
          capture_timestamp: timestamp,
          analysis_status: 'pending',
        });

        if (dbError) throw dbError;

        setLastCapture(publicUrl);
      } catch (error) {
        console.error('Error saving capture:', error);
      }
    }, 'image/png');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Screen Capture</h2>
        <p className="text-slate-400">
          Capture your TradingView charts automatically for AI analysis
        </p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Monitor className="text-emerald-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Capture Status</h3>
              <p className="text-sm text-slate-400">
                {isCapturing ? 'Active - Monitoring screen' : 'Inactive'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCapturing ? (
              <button
                onClick={startCapture}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all"
              >
                <Play size={16} />
                Start Capture
              </button>
            ) : (
              <>
                <button
                  onClick={captureFrame}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all"
                >
                  <Square size={16} />
                  Capture Now
                </button>
                <button
                  onClick={stopCapture}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all"
                >
                  <Pause size={16} />
                  Stop
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoCapture}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, autoCapture: e.target.checked }))
                }
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
              />
              <span className="text-sm text-slate-300">Auto-capture every</span>
            </label>
            <input
              type="number"
              min="10"
              max="300"
              value={settings.intervalSeconds}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, intervalSeconds: parseInt(e.target.value) }))
              }
              className="w-20 px-3 py-1 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-300">seconds</span>
          </div>

          {isCapturing && (
            <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white">Live Preview</span>
              </div>
              <div className="relative aspect-video bg-black rounded overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {lastCapture && (
            <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="text-blue-400" size={16} />
                <span className="text-sm font-medium text-white">Last Capture</span>
              </div>
              <img
                src={lastCapture}
                alt="Last capture"
                className="w-full rounded border border-slate-700"
              />
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
