<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import 'unfonts.css';
	import '../app.css';
	import type { LayoutServerData } from './$types';
	import { toast } from 'svelte-sonner';

	type Props = {
		children: Snippet;
		data: LayoutServerData;
	};

	const { children, data }: Props = $props();

	$inspect(data);

	type Position = 'top-center' | 'bottom-center';
	const positions = {
		mobile: 'bottom-center',
		desktop: 'top-center'
	} as const;

	let position: Position = $state(positions.desktop);

	$effect(() => {
		const url = new URL(window.location.href);
		const error = url.searchParams.get('error');
		// const success = url.searchParams.get('success');

		if (error === 'unauthenticated') {
			toast.info('Welcome back!');
		}
		if (error === 'unverified') {
			toast.error('Please activate your account first.');
		}
		if (error === 'forbidden') {
			toast.error('Access denied.');
		}

		// if (success === 'login') {
		// 	toast.success('Welcome back!');
		// }

		const mediaQuery = window.matchMedia('(max-width: 768px)');
		const updatePosition = () => {
			position = mediaQuery.matches ? positions.mobile : positions.desktop;
		};
		updatePosition();
		mediaQuery.addEventListener('change', updatePosition);
		return () => mediaQuery.removeEventListener('change', updatePosition);
	});
</script>

<Toaster {position} duration={3500} richColors />
<main class="grid min-h-svh place-items-center bg-gray-100 p-6 dark:bg-gray-900">
	{@render children()}
</main>
