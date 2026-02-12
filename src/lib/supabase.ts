import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ftkvesxndkhpvemstolw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a3Zlc3huZGtocHZlbXN0b2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjkxNTYsImV4cCI6MjA4NTcwNTE1Nn0.xEAdWRAaX3GHZ4CW9E1FBOzQAPJ3QDenKD6p1uy8L9o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
});
