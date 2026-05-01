import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && supabaseUrl !== 'https://your-project.supabase.co' && supabaseAnonKey && supabaseAnonKey !== 'your-anon-key';

if (!isConfigured) {
  console.warn('Supabase credentials missing or using placeholders. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

// If we have an invalid URL (like a placeholder), createClient might not error immediately,
// but any fetch will fail with "Failed to fetch".
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-please-set-me.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
