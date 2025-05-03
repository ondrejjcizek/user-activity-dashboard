<script lang="ts">
	import 'unfonts.css';
	import 'overlayscrollbars/styles/overlayscrollbars.css';
	import '../app.css';

	import type { Snippet } from 'svelte';
	import type { LayoutServerData } from './$types';

	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import NavigationProgress from '$lib/components/NavigationProgress.svelte';
	import { useOverlayScrollbars } from 'overlayscrollbars-svelte';
	import { OverlayScrollbars } from 'overlayscrollbars';
	import Lenis from 'lenis';
	import { lenisStore as lenis, setLenisStore } from '$lib/stores/lenis';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { useFrame } from '$lib/lifecycle-functions/useFrame';
	import PingClient from '$lib/components/PingClient.svelte';

	type Props = {
		children: Snippet;
		data: LayoutServerData;
	};

	const { children, data }: Props = $props();

	const [initialize, instance] = useOverlayScrollbars();

	type Position = 'top-center' | 'bottom-center';
	const positions = {
		mobile: 'bottom-center',
		desktop: 'top-center'
	} as const;

	let position: Position = $state(positions.desktop);

	$effect(() => {
		// Lenis
		const lenisInstance = new Lenis({
			duration: 0.6,
			easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			smoothWheel: true
		});
		setLenisStore(lenisInstance);

		beforeNavigate(() => {
			if ($lenis) {
				$lenis.stop();
			}
		});

		afterNavigate(() => {
			requestAnimationFrame(() => {
				$lenis?.start();
			});
		});

		function raf(time: number) {
			lenisInstance.raf(time);
			requestAnimationFrame(raf);
		}
		requestAnimationFrame(raf);

		// Overlay Scrollbars
		if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
			document.querySelectorAll('[data-overlayscrollbars-initialize]').forEach((element) => {
				if (element instanceof HTMLElement) {
					OverlayScrollbars(element, { scrollbars: { autoHide: 'move' } });
				}
			});
		}

		const url = new URL(window.location.href);
		const error = url.searchParams.get('error');

		if (error === 'unauthenticated') {
			toast.info('Welcome back!');
		}
		if (error === 'unverified') {
			toast.error('Please activate your account first.');
		}
		if (error === 'forbidden') {
			toast.error('Access denied.');
		}

		const flash = document.cookie
			.split('; ')
			.find((row) => row.startsWith('flash='))
			?.split('=')[1];

		if (flash) {
			toast.error(decodeURIComponent(flash)); // zobraz toast
			document.cookie = 'flash=; Max-Age=0'; // smaž cookie
		}

		const mediaQuery = window.matchMedia('(max-width: 768px)');
		const updatePosition = () => {
			position = mediaQuery.matches ? positions.mobile : positions.desktop;
		};
		updatePosition();
		mediaQuery.addEventListener('change', updatePosition);

		return () => {
			lenisInstance.destroy();
			mediaQuery.removeEventListener('change', updatePosition);
		};
	});

	useFrame((time) => {
		if (typeof time === 'number') {
			$lenis?.raf(time);
		}
	});
</script>

<Toaster {position} duration={4000} richColors />
<NavigationProgress />

{#key data.url}
	<main
		class="relative container mx-auto flex min-h-dvh flex-col items-center justify-center p-6 py-12"
		transition:fade={{ duration: 300 }}
	>
		{@render children()}
	</main>
{/key}

{#if data.session}
	<PingClient />
{/if}
