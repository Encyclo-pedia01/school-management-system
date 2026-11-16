/**
 * Supabase browser client — used once you move off the local-only data layer.
 *
 * 1. npm i @supabase/supabase-js
 * 2. copy .env.example -> .env.local and fill in the keys
 * 3. replace the reads in lib/store.tsx with queries, e.g.
 *
 *    const { data } = await supabase.from("students").select("*").eq("status", "Active");
 *
 * While NEXT_PUBLIC_SUPABASE_URL is unset the app keeps running on the seeded
 * local storage in lib/store.tsx, so nothing breaks without credentials.
 */
export const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

/** Returns a lazily-created client, or null while the app runs local-only. */
export async function getSupabase() {
  if (!supabaseConfigured) return null;
  const pkg = "@supabase/supabase-js";
  // Dynamic import kept non-literal so the package stays an optional dependency
  // and the build never fails while you're still local-only.
  const mod: any = await import(/* webpackIgnore: true */ pkg).catch(() => null);
  if (!mod?.createClient) return null;
  return mod.createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  );
}
