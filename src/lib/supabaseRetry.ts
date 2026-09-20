/**
 * Retries a Supabase query on failure (e.g. cold-start 503 errors on free tier).
 * Returns the last result regardless of success after maxAttempts.
 */
/**
 * Os builders do supabase-js sao PromiseLike (tem `then`, nao tem `catch` nem
 * `finally`), entao exigir `Promise` aqui rejeitava exatamente o uso normal:
 * `supabaseRetry(() => supabase.from('x').select('y'))`.
 */
export async function supabaseRetry<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: unknown }>,
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
