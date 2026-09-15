import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zzcrrmkjevknvmpbosdw.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Y3JybWtqZXZrbnZtcGJvc2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MjQyMTMsImV4cCI6MjEwNTAwMDIxM30.M1ttwrP9WvoWRflCSBh44Qb7E_vB4GQdpy54WmihCYs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
