<script lang="ts">
	let interval: ReturnType<typeof setInterval>;

	$effect(() => {
		const ping = () => fetch('/api/ping', { method: 'POST' });

		if (navigator.onLine) {
			ping(); // initial
			interval = setInterval(ping, 1_000);
		}

		return () => clearInterval(interval);
	});
</script>
