<script lang="ts">
	import { navigating } from '$app/state';
	import { Tween } from 'svelte/motion';
	import { fade } from 'svelte/transition';

	let show = $state(false);
	let progress = new Tween(0);

	let isNavigating = $derived(!!navigating.to);

	$effect(() => {
		if (isNavigating) {
			show = true;
			progress.set(0, { duration: 0 }).then(() => {
				progress.set(0.9, { duration: 4000 });
			});
		} else {
			progress.set(1, { duration: 300 }).then(() => {
				// wait until animation to 1 completes before hiding
				show = false;
				progress.set(0, { duration: 0 }); // reset for next time
			});
		}
	});
</script>

{#if show}
	<div class="bg-black dark:bg-white" out:fade style:--progress={progress.current}></div>
{/if}

<style>
	div {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 0.2rem;
		transform-origin: left;
		scale: var(--progress) 1;
		z-index: 9999;
		pointer-events: none;
	}
</style>
