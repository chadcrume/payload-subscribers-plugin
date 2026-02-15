export function isAbsoluteURL(url: string): boolean {
  // Checks if it starts with "//" or contains "://" after the first character
  return url.indexOf('://') > 0 || url.indexOf('//') === 0
}
