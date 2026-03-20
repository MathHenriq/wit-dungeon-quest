/**
 * Retries a Supabase query on failure (e.g. cold-start 503 errors on free tier).
 * Returns the last result regardless of success after maxAttempts.
 */
export async function supabaseRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>,
  maxAttempts = 3,
  baseDelayMs = 400,
): Promise<{ data: T | null; error: unknown }> {
  let result = await queryFn();
  for (let attempt = 1; attempt < maxAttempts && result.error; attempt++) {
    await new Promise(r => setTimeout(r, baseDelayMs * attempt));
    result = await queryFn();
  }
  return result;
}
