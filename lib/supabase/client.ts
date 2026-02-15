import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** Returns null when env is missing (e.g. build without Supabase or before Sheets migration). */
export function createClient() {
  if (!url || !key) return null as ReturnType<typeof createBrowserClient>
  return createBrowserClient(url, key)
}
