/**
 * Global Settings Context
 * ─────────────────────────────────────────────────────────────────────────
 * Fetches /api/settings ONCE at app startup and provides a stable
 * key→value map to all components via React context.
 * 
 * Usage:
 *   const { get } = useSettings();
 *   const siteName = get("site_name", "Global College");
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface SettingsContextValue {
  /** Look up a setting by key, with an optional fallback default. */
  get: (key: string, fallback?: string) => string;
  /** The raw array of all settings records. */
  settings: Array<{ key: string; value: string }>;
  /** True while the initial fetch is in flight. */
  loading: boolean;
  /** Manually refetch settings (e.g. after admin saves). */
  refetch: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  get: (_key: string, fallback = "") => fallback,
  settings: [],
  loading: true,
  refetch: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Array<{ key: string; value: string }>>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await fetch(`${BASE}/api/settings`);
      if (r.ok) {
        const data: Array<{ key: string; value: string }> = await r.json();
        setSettings(data);
      }
    } catch {
      // Silent — defaults will be used if fetch fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const map = new Map(settings.map(s => [s.key, s.value]));

  const get = (key: string, fallback = ""): string => map.get(key) ?? fallback;

  return (
    <SettingsContext.Provider value={{ get, settings, loading, refetch: load }}>
      {children}
    </SettingsContext.Provider>
  );
}

/** Access global settings anywhere in the tree. */
export function useSettings() {
  return useContext(SettingsContext);
}
