// ============================================================================
// GUILDOS — Input Sanitization Utilities
//
// Security helpers for sanitizing user-supplied text before storage or display.
// Not a replacement for server-side validation — defense-in-depth layer.
//
// Usage in API routes:
//   import { sanitizeHtml, sanitizeSqlWildcards } from '@/lib/security/sanitize';
//
//   const cleanName = sanitizeHtml(req.body.name);
//   const searchTerm = sanitizeSqlWildcards(req.body.search);
// ============================================================================

/**
 * Strip HTML tags and dangerous characters from user input.
 *
 * Removes all HTML tags (`<...>`), trims whitespace, and returns plain text.
 * Safe for display in text nodes — NOT safe for innerHTML/dangerouslySetInnerHTML
 * (use DOMPurify or similar for that).
 *
 * @param input - Raw user-supplied string
 * @returns Sanitized plain-text string (empty string for null/undefined)
 *
 * @example
 * sanitizeHtml('<script>alert("xss")</script>Hello')       // 'alert("xss")Hello'
 * sanitizeHtml('<b>Bold</b> <i>Italic</i>')                 // 'Bold Italic'
 * sanitizeHtml('   hello   ')                               // 'hello'
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';

  return input
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities back to readable text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    // Trim whitespace
    .trim();
}

/**
 * Escape SQL LIKE wildcards and special characters.
 *
 * Prevents attackers from exploiting `LIKE` clauses by injecting `%` or `_`
 * wildcards that match unintended rows. Also escapes the escape character
 * itself so the escaping is idempotent.
 *
 * Call this BEFORE adding your own `%` wildcards for prefix/suffix matching:
 *
 *   const safe = sanitizeSqlWildcards(userInput);
 *   const pattern = `%${safe}%`;  // your intentional wildcards
 *
 * @param input - Raw user-supplied search string
 * @returns String with LIKE-special characters escaped
 *
 * @example
 * sanitizeSqlWildcards('100%')          // '100\\%'
 * sanitizeSqlWildcards('foo_bar')       // 'foo\\_bar'
 * sanitizeSqlWildcards('safe search')   // 'safe search'
 * sanitizeSqlWildcards('\\escape')      // '\\\\escape'
 */
export function sanitizeSqlWildcards(input: string | null | undefined): string {
  if (!input) return '';

  return input
    // Escape the escape character first (must be first)
    .replace(/\\/g, '\\\\')
    // Escape LIKE wildcards
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    // Escape brackets for SQL Server compatibility (harmless on Postgres)
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\^/g, '\\^');
}
