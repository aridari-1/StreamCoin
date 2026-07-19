import { createBrowserClient } from '@supabase/ssr'

function isValidUrl(url: string) {
  try { new URL(url); return true } catch { return false }
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (!isValidUrl(url)) {
    // Return no-op stub during build / missing config
    const stub: any = new Proxy({}, { get: () => () => stub })
    stub.from = () => stub
    stub.channel = () => stub
    stub.on = () => stub
    stub.subscribe = () => ({})
    stub.removeChannel = () => {}
    stub.select = () => Promise.resolve({ data: null, error: null })
    stub.single = () => Promise.resolve({ data: null, error: null })
    stub.eq = () => stub
    stub.not = () => stub
    stub.order = () => stub
    stub.limit = () => Promise.resolve({ data: [], error: null })
    stub.insert = () => Promise.resolve({ data: null, error: null })
    stub.update = () => stub
    stub.upsert = () => Promise.resolve({ data: null, error: null })
    return stub
  }
  return createBrowserClient(url, key)
}
