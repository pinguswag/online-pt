"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPage() {
    const [status, setStatus] = useState("Ready to reset.");

    const handleReset = async () => {
        setStatus("Clearing Supabase Session...");
        await supabase.auth.signOut();

        setStatus("Clearing Local Storage...");
        localStorage.clear();
        sessionStorage.clear();

        // Clear cookies manually if possible (though HttpOnly ones are tricky)
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        setStatus("Done. Redirecting to login in 3 seconds...");
        setTimeout(() => {
            window.location.href = "/login";
        }, 3000);
    };

    return (
        <div style={{ padding: 40, fontFamily: 'monospace', textAlign: 'center' }}>
            <h1>Application Reset</h1>
            <p>If you are stuck in a login loop or seeing errors, this will clear all local data.</p>
            <button
                onClick={handleReset}
                style={{
                    padding: '15px 30px',
                    fontSize: 20,
                    cursor: 'pointer',
                    backgroundColor: '#ff4d4f',
                    color: 'white',
                    border: 'none',
                    borderRadius: 5,
                    marginTop: 20
                }}
            >
                ⚠️ Force Reset All Data
            </button>
            <p style={{ marginTop: 20, fontWeight: 'bold' }}>{status}</p>
        </div>
    );
}
