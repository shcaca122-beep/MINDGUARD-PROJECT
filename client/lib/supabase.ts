import { createClient } from '@supabase/supabase-js';

// Menggunakan env ATAU langsung menggunakan URL & Key proyek Supabase kamu
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://pqjkihmvjikawttraetr.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_0kbbre8fr-5z4FXm-pX1Pg_1uz2q21M";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);