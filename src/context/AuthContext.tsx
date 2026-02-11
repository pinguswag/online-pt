"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, auth } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string) => Promise<void>;
    signup: (data: Omit<User, 'id'>) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const currentUser = auth.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string) => {
        const loggedInUser = auth.login(username);
        setUser(loggedInUser);

        // Redirect based on role
        if (loggedInUser.role === 'coach') {
            router.push('/coach/dashboard');
        } else {
            router.push('/member/dashboard');
        }
    };

    const signup = async (data: Omit<User, 'id'>) => {
        const output = auth.createUser(data);
        // Auto login after signup
        await login(output.username);
    };

    const logout = () => {
        auth.logout();
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
