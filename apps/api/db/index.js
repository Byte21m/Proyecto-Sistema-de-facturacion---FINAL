import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan las variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default supabase;
