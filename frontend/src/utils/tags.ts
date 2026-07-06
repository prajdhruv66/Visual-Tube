/** Converts a comma-separated tags string (as typed in a form) into a clean string[]. */
export function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}
