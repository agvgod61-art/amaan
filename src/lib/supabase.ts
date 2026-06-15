import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lldaazitowbsjwlycjhu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dBDYLWCCPt_MlDBsrL5haQ_EoOpNK1K';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
