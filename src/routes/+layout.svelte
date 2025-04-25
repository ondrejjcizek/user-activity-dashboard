<script lang="ts">
	import type { Snippet } from 'svelte';
	import '../app.css';

	type Props = {
		children: Snippet;
	};

	const { children }: Props = $props();
</script>

<main>
	{@render children()}
</main>
