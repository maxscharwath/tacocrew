import { twMerge } from 'tailwind-merge';

type ClassNameValue = string | null | undefined | false;

export function cn(...inputs: ClassNameValue[]) {
  return twMerge(inputs.filter(Boolean).join(' '));
}
