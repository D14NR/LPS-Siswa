import { createClient } from "@supabase/supabase-js";

const rawLps = import.meta.env.VITE_SUPABASE_LPS || import.meta.env.VITE_SUPABASE_URL || "";
const anonLps = import.meta.env.VITE_SUPABASE_ANON_KEY_LPS || import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const rawKbm = import.meta.env.VITE_SUPABASE_URL_KBM || import.meta.env.VITE_SUPABASE_KBM || "";
const anonKbm = import.meta.env.VITE_SUPABASE_ANON_KEY_KBM || import.meta.env.VITE_SUPABASE_ANON_KEY_KBM || "";

const resolveUrl = (raw: string) => {
	if (!raw) return "";
	return raw.startsWith("http") ? raw : `https://${raw}.supabase.co`;
};

const lpsUrl = resolveUrl(rawLps);
const kbmUrl = resolveUrl(rawKbm);

if (!lpsUrl) {
	console.error("⚠️ Supabase LPS URL is not configured. Set VITE_SUPABASE_LPS in .env");
}
if (!anonLps) {
	console.error("⚠️ Supabase LPS Anon Key is not configured. Set VITE_SUPABASE_ANON_KEY_LPS in .env");
}

if (!kbmUrl) {
	console.warn("⚠️ Supabase KBM URL not configured. Set VITE_SUPABASE_URL_KBM if needed");
}
if (!anonKbm) {
	console.warn("⚠️ Supabase KBM Anon Key not configured. Set VITE_SUPABASE_ANON_KEY_KBM if needed");
}

export const supabaseLPS = createClient(lpsUrl || "https://dummy.supabase.co", anonLps || "dummy-key");
export const supabaseKBM = createClient(kbmUrl || "https://dummy.supabase.co", anonKbm || "dummy-key");

// Default export stays as LPS client for existing code paths that import `supabase`.
export const supabase = supabaseLPS;
export default supabase;
