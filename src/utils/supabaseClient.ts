import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Accept either a full URL (`https://<ref>.supabase.co`) or just the project ref.
const supabaseUrl = rawUrl.startsWith("http")
	? rawUrl
	: rawUrl
	? `https://${rawUrl}.supabase.co`
	: "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
