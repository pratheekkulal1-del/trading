import { useState, useRef, useEffect } from 'react';
import { Monitor, Square, Play, Pause, Settings, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { OpenAIAnalyzer } from '../lib/openai';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
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

  const extractPrice = (text: string): number | null => {
    const matches = text.match(/\$?([0-9]+(?:[,.]?[0-9]+)*)/g);
    if (matches && matches.length > 0) {
      const price = parseFloat(matches[0].replace(/[$,]/g, ''));
      return isNaN(price) ? null : price;
    }
    return null;
  };

  const extractStructuresFromAnalysis = (analysisText: string, timeframe: string) => {
    const structures = [];
    const lines = analysisText.toLowerCase().split('\n');

    for (const line of lines) {
      if (line.includes('choch') || line.includes('change of character')) {
        const price = extractPrice(line);
        if (price) {
          structures.push({
            type: 'choch',
            direction: line.includes('bullish') ? 'bullish' : line.includes('bearish') ? 'bearish' : 'neutral',
            priceLevel: price,
            confidence: 0.8,
            coordinates: { x: 0, y: 0, width: 0, height: 0 }
          });
        }
      }
      if (line.includes('bos') || line.includes('break of structure')) {
        const price = extractPrice(line);
        if (price) {
          structures.push({
            type: 'bos',
            direction: line.includes('bullish') ? 'bullish' : line.includes('bearish') ? 'bearish' : 'neutral',
            priceLevel: price,
            confidence: 0.85,
            coordinates: { x: 0, y: 0, width: 0, height: 0 }
          });
        }
      }
      if (line.includes('order block')) {
        const price = extractPrice(line);
        if (price) {
          structures.push({
            type: 'order_block',
            direction: line.includes('bullish') || line.includes('demand') ? 'bullish' : line.includes('bearish') || line.includes('supply') ? 'bearish' : 'neutral',
            priceLevel: price,
            confidence: 0.75,
            coordinates: { x: 0, y: 0, width: 0, height: 0 }
          });
        }
      }
      if (line.includes('liquidity') || line.includes('pool')) {
        const price = extractPrice(line);
        if (price) {
          structures.push({
            type: 'liquidity',
            direction: line.includes('above') ? 'bullish' : line.includes('below') ? 'bearish' : 'neutral',
            priceLevel: price,
            confidence: 0.7,
            coordinates: { x: 0, y: 0, width: 0, height: 0 }
          });
        }
      }
      if (line.includes('poi') || line.includes('point of interest')) {
        const price = extractPrice(line);
        if (price) {
          structures.push({
            type: 'poi',
            direction: 'neutral',
            priceLevel: price,
            confidence: 0.8,
            coordinates: { x: 0, y: 0, width: 0, height: 0 }
          });
        }
      }
      if (line.includes('fib') && (line.includes('50') || line.includes('0.5'))) {
        const price = extractPrice(line);
        if (price) {
          structures.push({
            type: 'fib_50',
            direction: 'neutral',
            priceLevel: price,
            confidence: 0.75,
            coordinates: { x: 0, y: 0, width: 0, height: 0 }
          });
        }
      }
    }

    return structures;
  };

  const analyzeCapture = async (imageBase64: string, captureId: string) => {
    try {
      setAnalysisStatus('Analyzing chart...');

      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('openai_api_key')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!settingsData?.openai_api_key) {
        setAnalysisStatus('OpenAI API key not configured');
        setTimeout(() => setAnalysisStatus(''), 3000);
        return;
      }

      const analyzer = new OpenAIAnalyzer(settingsData.openai_api_key);

      const timeframes = ['4h', '15m', '3m', '1m'] as const;

      for (const timeframe of timeframes) {
        setAnalysisStatus(`Analyzing ${timeframe} timeframe...`);
        const analysis = await analyzer.analyzeChart(imageBase64, timeframe);

        const structures = extractStructuresFromAnalysis(analysis.analysis, timeframe);

        for (const structure of structures) {
          await supabase.from('market_structures').insert({
            user_id: user?.id,
            capture_id: captureId,
            structure_type: structure.type,
            direction: structure.direction,
            price_level: structure.priceLevel,
            confidence: structure.confidence,
            timeframe: timeframe,
            coordinates: structure.coordinates,
          });
        }
      }

      await supabase
        .from('chart_captures')
        .update({ analysis_status: 'completed' })
        .eq('id', captureId);

      setAnalysisStatus('Analysis complete!');
      setTimeout(() => setAnalysisStatus(''), 3000);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisStatus('Analysis failed');
      setTimeout(() => setAnalysisStatus(''), 3000);
    }
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
        setIsAnalyzing(true);
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

        const { data: captureData, error: dbError } = await supabase
          .from('chart_captures')
          .insert({
            user_id: user.id,
            capture_url: publicUrl,
            capture_timestamp: timestamp,
            analysis_status: 'analyzing',
          })
          .select()
          .single();

        if (dbError) throw dbError;

        setLastCapture(publicUrl);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          analyzeCapture(base64Data, captureData.id);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Error saving capture:', error);
        setIsAnalyzing(false);
      } finally {
        setIsAnalyzing(false);
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
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium rounded-lg transition-all"
                >
                  {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Square size={16} />}
                  {isAnalyzing ? 'Analyzing...' : 'Capture Now'}
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

          {analysisStatus && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="text-blue-400 animate-spin" size={16} />
                <span className="text-sm font-medium text-blue-400">{analysisStatus}</span>
              </div>
            </div>
          )}

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
