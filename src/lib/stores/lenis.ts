import type Lenis from 'lenis';
import { writable } from 'svelte/store';

export const lenisStore = writable<Lenis | null>(null);

export function setLenisStore(lenis: Lenis) {
	lenisStore.set(lenis);
}
