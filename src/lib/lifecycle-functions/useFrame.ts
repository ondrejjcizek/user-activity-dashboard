import { onMount } from 'svelte';
import { raf } from '$lib/utils/tempus';

type FrameCallback = (time: number | undefined) => void;

export function useFrame(callback: FrameCallback, priority = 0) {
	onMount(() => {
		if (callback) {
			raf.add(callback, priority);
		}

		return () => raf.remove(callback);
	});
}
