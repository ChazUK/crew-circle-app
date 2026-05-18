export function validateImdbId(input: string): string | null {
  const match = input.match(/nm\d+/);
  return match ? match[0] : null;
}
