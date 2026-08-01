import { createClient } from '@supabase/supabase-js';

// Menggunakan env ATAU langsung menggunakan URL & Key proyek Supabase kamu
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://pqjkihmvjikawttraetr.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_0k6bre8fr-5z4FXm-pXTPg_Iu22q2IW';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);