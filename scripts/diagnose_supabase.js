
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ftkvesxndkhpvemstolw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a3Zlc3huZGtocHZlbXN0b2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjkxNTYsImV4cCI6MjA4NTcwNTE1Nn0.xEAdWRAaX3GHZ4CW9E1FBOzQAPJ3QDenKD6p1uy8L9o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log("Testing Supabase Connection...");

    // 1. Basic anonymous read check
    try {
        const { count, error } = await supabase
            .from('users_profile')
            .select('*', { count: 'exact', head: true });

        console.log("Anon Read Check - Count:", count, "Error:", error);
    } catch (e) {
        console.error("Anon Read Check Failed Exception:", e);
    }

    // 2. Auth Signup Check
    // Use a valid email format
    const testEmail = `testuser${Date.now()}@gmail.com`;
    const testPassword = 'password123';

    console.log(`Attempting Signup with ${testEmail}...`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
            data: {
                nickname: 'TestUser',
                role: 'member'
            }
        }
    });

    if (authError) {
        console.error("Signup Failed:", authError);
        return;
    }

    if (!authData.user) {
        console.error("Signup successful but no user returned??");
        return;
    }

    console.log("Signup Successful, User ID:", authData.user.id);
    const userId = authData.user.id;

    // 3. Check for Profile (Trigger)
    console.log("Checking for Profile (wait 3s for trigger)...");
    await new Promise(r => setTimeout(r, 3000));

    // We need to sign in to read own profile (RLS usually requires auth)
    // Actually signUp usually returns a session, so the client *should* be authenticated.
    // Let's check session.
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Current Session User:", session?.user?.id);

    const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', userId)
        .single();

    if (profile) {
        console.log("✅ Profile found (Trigger worked):", profile);
    } else {
        console.error("❌ Profile NOT found (Trigger failed or RLS blocked):", profileError);
        console.log("Trigger Error Details (if any specific code):", profileError?.code);

        // 4. Try Manual Insert (Client-side healing)
        console.log("Attempting Client-side Insert...");

        // We need to make sure we are sending the right data
        const { error: insertError } = await supabase
            .from('users_profile')
            .insert({
                id: userId,
                nickname: 'TestUser',
                role: 'member',
                required_diet_photos: 3,
                code: 'TEST' + Math.floor(Math.random() * 1000)
            });

        if (insertError) {
            console.error("❌ Client-side Insert Failed:", insertError);
        } else {
            console.log("✅ Client-side Insert Succeeded");
        }
    }
}

testConnection().catch(console.error);
