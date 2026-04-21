/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
    // Add ignoreURLParametersMatching to prevent SW from messing with Supabase queries
    // or just exclude the domain entirely if Serwist supports it in runtimeCaching
});

// Add a specific rule to ignore Supabase
self.addEventListener("fetch", (event) => {
    if (event.request.url.includes("supabase.co")) {
        return; // Let the browser handle it directly
    }
});

serwist.addEventListeners();
