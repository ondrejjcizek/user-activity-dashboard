<script lang="ts">
	import { onNavigate } from '$app/navigation';

	// Utility to detect iOS Safari (iPad/iPhone/iPod)
	const isIOS =
		typeof navigator !== 'undefined' &&
		(/iP(ad|hone|od)/.test(navigator.userAgent) ||
			(navigator.userAgent.includes('Macintosh') && 'ontouchend' in document));

	onNavigate((navigation) => {
		// Disable ViewTransition on iOS or unsupported browsers
		if (!document.startViewTransition || isIOS) return;

		// Skip transition if only URL hash or search changes
		if (
			navigation.from?.url.pathname === navigation.to?.url.pathname &&
			navigation.from?.url.search === navigation.to?.url.search
		)
			return;

		return new Promise((resolve) => {
			// Ensure nav participates in the transition paint order
			const navElement = document.getElementById('main-navigation');
			if (navElement) {
				navElement.style.viewTransitionName = 'navigation';
			}

			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>
