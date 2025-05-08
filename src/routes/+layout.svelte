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
	import { Moon, Sun } from 'lucide-svelte';
	import { setMode, resetMode, ModeWatcher, mode } from 'mode-watcher';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	type Props = {
		children: Snippet;
		data: LayoutServerData;
	};

	let { children, data }: Props = $props();

	const [initialize] = useOverlayScrollbars();

	type Position = 'top-center' | 'bottom-center';
	const positions = {
		mobile: 'top-center',
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
<ModeWatcher defaultMode="system" />

{#key data.url}
	<main class="bg-background text-foreground" data-vaul-drawer-wrapper>
		<div
			class="relative z-10 container mx-auto flex min-h-svh flex-col items-center justify-center p-6 py-12"
			{...initialize}
			transition:fade={{ duration: 300 }}
			data-vaul-drawer-wrapper
		>
			<div class="absolute top-4 right-4">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline', size: 'icon' })}>
						<Sun
							class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:hidden dark:scale-0 dark:-rotate-90"
						/>
						<Moon
							class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
						/>
						<span class="sr-only">Toggle theme</span>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Item onclick={() => setMode('light')}>Light</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => setMode('dark')}>Dark</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => resetMode()}>System</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
			{@render children()}
		</div>
	</main>
{/key}

{#if data.session}
	<PingClient />
{/if}
