/** Validates JSON body is a plain object and strips prototype-pollution keys. */
export function sanitizeJsonBody(body: unknown): Record<string, unknown> | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const raw = body as Record<string, unknown>
  const { __proto__: _p, constructor: _c, ...safe } = raw
  return safe
}
