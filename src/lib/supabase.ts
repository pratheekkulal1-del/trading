import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      training_materials: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_type: string;
          file_url: string;
          file_size: number;
          extracted_content: string | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          created_at: string;
          processed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['training_materials']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['training_materials']['Insert']>;
      };
      trading_rules: {
        Row: {
          id: string;
          user_id: string;
          rule_name: string;
          rule_description: string;
          rule_type: 'market_structure' | 'entry' | 'exit' | 'risk_management';
          timeframe: '4h' | '15m' | '3m' | '1m' | 'all';
          confidence_threshold: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trading_rules']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['trading_rules']['Insert']>;
      };
      chart_captures: {
        Row: {
          id: string;
          user_id: string;
          capture_url: string;
          timeframe_4h_url: string | null;
          timeframe_15m_url: string | null;
          timeframe_1m_3m_url: string | null;
          capture_timestamp: string;
          analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chart_captures']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['chart_captures']['Insert']>;
      };
      market_structures: {
        Row: {
          id: string;
          chart_capture_id: string;
          user_id: string;
          timeframe: '4h' | '15m' | '3m' | '1m';
          structure_type: 'choch' | 'bos' | 'order_block' | 'liquidity' | 'poi' | 'fib_50';
          direction: 'bullish' | 'bearish' | 'neutral';
          price_level: number;
          confidence: number;
          coordinates: { x: number; y: number; width: number; height: number };
          detected_at: string;
        };
        Insert: Omit<Database['public']['Tables']['market_structures']['Row'], 'id' | 'detected_at'>;
        Update: Partial<Database['public']['Tables']['market_structures']['Insert']>;
      };
      trading_signals: {
        Row: {
          id: string;
          user_id: string;
          chart_capture_id: string | null;
          signal_type: 'buy' | 'sell';
          entry_price: number;
          stop_loss: number;
          take_profit: number;
          risk_reward_ratio: number;
          position_size: number | null;
          confidence_score: number;
          timeframe_4h_structure: string | null;
          timeframe_15m_action: string | null;
          timeframe_3m_orderblock: string | null;
          timeframe_1m_entry: string | null;
          status: 'pending' | 'active' | 'triggered' | 'expired' | 'cancelled';
          alert_sent: boolean;
          created_at: string;
          triggered_at: string | null;
          expired_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['trading_signals']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['trading_signals']['Insert']>;
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          capture_interval_seconds: number;
          min_confidence_threshold: number;
          alert_sound_enabled: boolean;
          alert_toast_enabled: boolean;
          risk_reward_ratio: number;
          openai_api_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_settings']['Insert']>;
      };
    };
  };
};
