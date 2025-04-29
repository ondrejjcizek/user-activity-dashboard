<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	export let data: {
		success: boolean;
		error?: string;
		callbackURL: string;
	};

	onMount(() => {
		if (data.success) {
			console.log('✅ Email verified. Redirecting...');
			setTimeout(() => {
				goto(data.callbackURL);
			}, 1000); // slight delay for session cookie to attach
		} else {
			console.error('❌ Verification failed:', data.error);
		}
	});
</script>

{#if data.success}
	<h1>Email verified successfully!</h1>
	<p>Redirecting to your account...</p>
{:else}
	<h1>Verification failed</h1>
	<p>{data.error}</p>
{/if}
