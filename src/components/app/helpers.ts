export const mergeClassNames = (classNames: ((string | undefined)[] | string | undefined)[]) => {
  return classNames
    .flat(Infinity)
    .filter((className) => !!className)
    .join(' ')
}
