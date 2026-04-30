import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Accept either a full URL (`https://<ref>.supabase.co`) or just the project ref.
const supabaseUrl = rawUrl.startsWith("http")
	? rawUrl
	: rawUrl
	? `https://${rawUrl}.supabase.co`
	: "";

if (!supabaseUrl) {
	console.error("⚠️ Supabase URL is not configured. Check that VITE_SUPABASE_URL is set in .env file");
}
if (!supabaseAnonKey) {
	console.error("⚠️ Supabase Anon Key is not configured. Check that VITE_SUPABASE_ANON_KEY is set in .env file");
}

export const supabase = createClient(supabaseUrl || "https://dummy.supabase.co", supabaseAnonKey || "dummy-key");

export default supabase;
