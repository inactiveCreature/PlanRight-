/**
 * Utility function for merging class names
 * Similar to clsx but simpler implementation
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
