import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge.
 * @param {...ClassValue[]} inputs - The classes to merge.
 * @returns {string} The merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
