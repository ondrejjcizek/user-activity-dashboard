<script lang="ts">
	import type { Snippet } from 'svelte';
	import 'unfonts.css';
	import '../app.css';

	type Props = {
		children: Snippet;
	};

	const { children }: Props = $props();
</script>

{@render children()}
