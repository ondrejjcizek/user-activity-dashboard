<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import 'unfonts.css';
	import '../app.css';

	type Props = {
		children: Snippet;
	};

	const { children }: Props = $props();

	type Position = 'top-center' | 'bottom-center';
	const positions = {
		mobile: 'bottom-center',
		desktop: 'top-center'
	} as const;

	let position: Position = $state(positions.desktop);

	$effect(() => {
		const mediaQuery = window.matchMedia('(max-width: 768px)');
		const updatePosition = () => {
			position = mediaQuery.matches ? positions.mobile : positions.desktop;
		};
		updatePosition();
		mediaQuery.addEventListener('change', updatePosition);
		return () => mediaQuery.removeEventListener('change', updatePosition);
	});
</script>

<Toaster {position} />
<main class="p-6 dark:bg-slate-700">
	{@render children()}
</main>
