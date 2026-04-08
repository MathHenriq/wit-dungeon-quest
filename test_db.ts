import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);
const run = async () => {
  const { data } = await supabase.from('floors').select('*');
  console.log('Floors in DB:', data?.length ?? 0);
  console.log(JSON.stringify(data, null, 2));
};
run();
