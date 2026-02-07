/**
 * Merges an array of class name values (strings or arrays of strings) into a single space-separated
 * string. Flattens nested arrays and filters out falsy values. Used by app components for
 * combining base classes, CSS module classes, and optional overrides.
 *
 * @param classNames - Array of class name values (string, undefined, or array of same)
 * @returns Single string of non-empty class names separated by spaces
 */
export const mergeClassNames = (classNames: ((string | undefined)[] | string | undefined)[]) => {
  return classNames
    .flat(Infinity)
    .filter((className) => !!className)
    .join(' ')
}
