"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSession, onUnauthorized, signOut as apiSignOut, type StorefrontUser } from "@/lib/api";

export type SessionStatus = "loading" | "signed-in" | "signed-out" | "unavailable";

interface SessionContextType {
    status: SessionStatus;
    user: StorefrontUser | null;
    /** Re-reads the session (after sign-in or sign-out). */
    refresh: () => Promise<SessionStatus>;
    signOut: () => Promise<boolean>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

async function readSession(): Promise<{ status: SessionStatus; user: StorefrontUser | null }> {
    const result = await getSession();
    if (!result.ok) return { status: "unavailable", user: null };
    const user = result.data?.user ?? null;
    return { status: user ? "signed-in" : "signed-out", user };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<{ status: SessionStatus; user: StorefrontUser | null }>({ status: "loading", user: null });

    useEffect(() => {
        let cancelled = false;
        void readSession().then((next) => {
            if (!cancelled) setState(next);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const refresh = useCallback(async () => {
        const next = await readSession();
        setState(next);
        return next.status;
    }, []);

    // Any storefront call answering 401 means the session ended (expired or signed out elsewhere).
    // The session route itself always answers 200, so this cannot loop.
    useEffect(() => onUnauthorized(() => void refresh()), [refresh]);

    const signOut = useCallback(async () => {
        const result = await apiSignOut();
        if (result.ok) setState({ status: "signed-out", user: null });
        return result.ok;
    }, []);

    const value = useMemo(() => ({ ...state, refresh, signOut }), [state, refresh, signOut]);

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error("useSession must be used within a SessionProvider");
    }
    return context;
}

/** A short label for the header: first name, else the masked phone number. */
export function accountLabel(user: StorefrontUser): string {
    const first = user.name?.trim().split(/\s+/)[0];
    if (first && user.name !== "Silk Circle Member") return first;
    if (user.phoneNumber) return `••${user.phoneNumber.slice(-4)}`;
    return "Account";
}
