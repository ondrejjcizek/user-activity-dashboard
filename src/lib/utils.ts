import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function isAPIError(err: unknown): err is { body: { code: string } } {
	return typeof err === 'object' && err !== null && 'body' in err;
}
