// sys-wms-web/js/config.js
// Configuration File for Supabase Credentials

// Replace these values with your actual Supabase project credentials!
// You can find these in your Supabase Dashboard -> Project Settings -> API
const SUPABASE_URL = 'https://ormjypixacnedlmqrxfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_v76dQER4szVgnbB8yNDhAA_VoNg51Gw';

// Initialize Supabase client
window.sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

