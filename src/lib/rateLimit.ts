const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  key: string,
  limit  = 3,     
  window = 60_000 
): { success: boolean; remaining: number; resetAt: number } {
  const now    = Date.now()
  const entry  = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    // First request or window expired — reset
    rateLimitMap.set(key, { count: 1, resetAt: now + window })
    return { success: true, remaining: limit - 1, resetAt: now + window }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}