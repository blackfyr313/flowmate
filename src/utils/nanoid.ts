/**
 * Generates a random unique ID (URL-safe).
 * Avoids a full uuid dependency for simple IDs.
 */
export function nanoid(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const values = crypto.getRandomValues(new Uint8Array(length))
  for (const byte of values) {
    result += chars[byte % chars.length]
  }
  return result
}
