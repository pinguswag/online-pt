
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ftkvesxndkhpvemstolw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a3Zlc3huZGtocHZlbXN0b2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjkxNTYsImV4cCI6MjA4NTcwNTE1Nn0.xEAdWRAaX3GHZ4CW9E1FBOzQAPJ3QDenKD6p1uy8L9o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLS() {
    console.log("Testing RLS Recursion Fix...");

    try {
        // Attempt to select from users_profile.
        // If recursion exists, this will throw 500 or timeout.
        // If fixed, it should return 200 (even if empty data).
        const start = Date.now();
        const { data, error } = await supabase
            .from('users_profile')
            .select('*')
            .limit(1);
        const duration = Date.now() - start;

        if (error) {
            console.log(`❌ Query Failed (${duration}ms):`, error);
        } else {
            console.log(`✅ Query Succeeded (${duration}ms). Data length: ${data.length}`);
            console.log("No infinite recursion detected.");
        }

    } catch (e) {
        console.error("Exception:", e);
    }
}

testRLS();
