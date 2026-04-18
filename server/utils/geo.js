/**
 * IP geolocation utility with in-memory cache.
 * Uses ip-api.com (free, 45 req/min) with CDN header fallback.
 *
 * Cache entries expire after 1 hour to balance freshness with rate limits.
 */
import { query } from './db.js'

const cache = new Map()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
const MAX_CACHE_SIZE = 5000

/**
 * Look up geolocation for an IP address.
 * Returns { country, region, city } or null.
 * Results are cached in memory.
 */
export async function lookupIp(ip) {
  if (!ip || ip.startsWith('127.') || ip === '::1' || ip === 'localhost') return null

  // Check cache
  const cached = cache.get(ip)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 'success') return null

    const result = {
      country: data.country || null,
      region: data.regionName || null,
      city: data.city || null,
    }

    // Evict oldest entries if cache is full
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldest = cache.keys().next().value
      cache.delete(oldest)
    }
    cache.set(ip, { data: result, ts: Date.now() })

    return result
  } catch {
    return null
  }
}

/**
 * Try to extract geolocation from CDN/proxy headers.
 * Returns { country, region, city } or null.
 */
export function geoFromHeaders(event) {
  // Cloudflare
  const cfCountry = getHeader(event, 'cf-ipcountry')
  const cfCity = getHeader(event, 'cf-ipcity')

  // Vercel
  const vercelCity = getHeader(event, 'x-vercel-ip-city')
  const vercelCountry = getHeader(event, 'x-vercel-ip-country')
  const vercelRegion = getHeader(event, 'x-vercel-ip-country-region')

  // AWS CloudFront
  const cfrontCountry = getHeader(event, 'cloudfront-viewer-country-name')
  const cfrontCity = getHeader(event, 'cloudfront-viewer-city')
  const cfrontRegion = getHeader(event, 'cloudfront-viewer-country-region-name')

  const country = vercelCountry || cfCountry || cfrontCountry || null
  const city = vercelCity || cfCity || cfrontCity || null
  const region = vercelRegion || cfrontRegion || null

  if (country || city) {
    return { country, region, city }
  }
  return null
}

/**
 * Resolve geolocation for a request: CDN headers first, then IP lookup.
 * Returns { country, region, city } or null.
 */
export async function resolveGeo(event, ip) {
  const fromHeaders = geoFromHeaders(event)
  if (fromHeaders) return fromHeaders
  return lookupIp(ip)
}

/**
 * Format geo data into a human-readable location string.
 * e.g. "London, England, United Kingdom"
 */
export function formatLocation(geo) {
  if (!geo) return null
  const parts = [geo.city, geo.region, geo.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

/**
 * Enrich a share_views record with geolocation data asynchronously.
 * Non-blocking, best-effort.
 */
export function enrichShareView(event, ip, viewId) {
  if (!viewId || !ip || ip.startsWith('127.') || ip === '::1') return

  resolveGeo(event, ip)
    .then((geo) => {
      if (geo && (geo.country || geo.city)) {
        query('UPDATE share_views SET country = $1, region = $2, city = $3 WHERE id = $4', [
          geo.country,
          geo.region,
          geo.city,
          viewId,
        ])
      }
    })
    .catch(() => {})
}

/**
 * Enrich a session record with geolocation data asynchronously.
 * Non-blocking, best-effort.
 */
export function enrichSession(event, ip, sessionId) {
  if (!sessionId || !ip || ip.startsWith('127.') || ip === '::1') return

  resolveGeo(event, ip)
    .then((geo) => {
      const location = formatLocation(geo)
      if (location) {
        query('UPDATE sessions SET location = $1 WHERE id = $2', [location, sessionId])
      }
    })
    .catch(() => {})
}
