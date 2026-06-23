import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lldaazitowbsjwlycjhu.supabase.co/rest/v1/';
const SUPABASE_PUBLIC_KEY = 'sb_publishable_dBDYLWCCPt_MlDBsrL5haQ_EoOpNK1K';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
