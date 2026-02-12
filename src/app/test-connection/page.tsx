"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function TestConnectionPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<string>("Ready");
    const [session, setSession] = useState<any>(null);

    const log = (msg: string, data?: any) => {
        const timestamp = new Date().toLocaleTimeString();
        const text = `${timestamp}: ${msg} ${data ? JSON.stringify(data, null, 2) : ''}`;
        setLogs(prev => [...prev, text]);
        console.log(msg, data);
    };

    const checkConnection = async () => {
        setLogs([]);
        setStatus("Testing...");
        log("Starting Supabase Diagnostic...");

        try {
            // 0. Raw HTTP Check (Bypass SDK)
            log("0. Testing Raw HTTP Connectivity...");
            const projectUrl = 'https://ftkvesxndkhpvemstolw.supabase.co';
            try {
                const start = Date.now();
                // Test a public endpoint (e.g. storage or just root)
                // Actually Supabase root returns 404 or a welcome JSON sometimes.
                // Better to try the REST endpoint itself for a public table or just OPTIONS
                const res = await fetch(`${projectUrl}/rest/v1/users_profile?select=count`, {
                    method: 'GET',
                    headers: {
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a3Zlc3huZGtocHZlbXN0b2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjkxNTYsImV4cCI6MjA4NTcwNTE1Nn0.xEAdWRAaX3GHZ4CW9E1FBOzQAPJ3QDenKD6p1uy8L9o',
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a3Zlc3huZGtocHZlbXN0b2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjkxNTYsImV4cCI6MjA4NTcwNTE1Nn0.xEAdWRAaX3GHZ4CW9E1FBOzQAPJ3QDenKD6p1uy8L9o'
                    }
                });
                const duration = Date.now() - start;
                log(`0. Raw HTTP Result: Status ${res.status} (${duration}ms)`);

                if (!res.ok) {
                    const text = await res.text();
                    log(`❌ Raw Request Failed: ${text}`);
                } else {
                    log("✅ Raw Request Succeeded!");
                }
            } catch (rawErr: any) {
                log("❌ Raw Connectivity Failed (Network Error?)", rawErr.message);
                log("ℹ️ If this failed, your network is blocking Supabase.");
                return; // Stop here if network is down
            }

            // 1. Check Public Access
            log("1. Testing SDK Public Table Access...");
            const { count, error: countError } = await supabase
                .from('users_profile')
                .select('*', { count: 'exact', head: true });

            if (countError) {
                log("❌ Public Access Failed", countError);
            } else {
                log("✅ Public Access OK. Count:", count);
            }

            // 2. Check Auth Session
            log("2. Checking Auth Session...");
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
            setSession(currentSession);

            if (sessionError) {
                log("❌ Get Session Failed", sessionError);
            } else if (currentSession) {
                log("✅ Session Found", currentSession.user.id);

                // 3. Check Profile Read
                log("3. Reading Profile for User...");
                const { data: profile, error: profileError } = await supabase
                    .from('users_profile')
                    .select('*')
                    .eq('id', currentSession.user.id)
                    .single();

                if (profile) {
                    log("✅ Profile Found", profile);
                } else {
                    log("❌ Profile Read Failed or Missing", profileError);

                    // 4. Try Insert (if missing)
                    log("4. Attempting Insert...");
                    const { error: insertError } = await supabase
                        .from('users_profile')
                        .insert({
                            id: currentSession.user.id,
                            nickname: 'Test Browser User',
                            role: 'member',
                            required_diet_photos: 3,
                            code: 'BROWSER' + Math.floor(Math.random() * 100).toString()
                        })
                        .select();

                    if (insertError) {
                        log("❌ Insert Failed", insertError);
                    } else {
                        log("✅ Insert Succeeded!");
                    }
                }

            } else {
                log("ℹ️ No active session. Please login first to test RLS.");
            }

        } catch (err: any) {
            log("❌ Critical Exception", err.message);
        } finally {
            setStatus("Done");
        }
    };

    return (
        <div style={{ padding: 40, fontFamily: 'monospace' }}>
            <h1>Supabase Connection Diagnostics</h1>
            <div style={{ marginBottom: 20 }}>
                <button
                    onClick={checkConnection}
                    style={{ padding: '10px 20px', fontSize: 16, cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: 5 }}
                >
                    Run Diagnostics
                </button>
                <span style={{ marginLeft: 20, fontWeight: 'bold' }}>Status: {status}</span>
            </div>

            <div style={{ background: '#f4f4f4', padding: 20, borderRadius: 10, minHeight: 300, whiteSpace: 'pre-wrap', border: '1px solid #ccc' }}>
                {logs.length === 0 ? "Click button to start..." : logs.join('\n\n')}
            </div>

            {session && (
                <div style={{ marginTop: 20 }}>
                    <h3>Current User</h3>
                    <pre>{JSON.stringify(session.user, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
