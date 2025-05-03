<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Alert from '$lib/components/ui/alert';
	import { ShieldCheck, ShieldX } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	export let data: {
		success: boolean;
		error?: string;
		callbackURL: string;
	};

	onMount(() => {
		if (data.success) {
			console.log('✅ Email verified. Redirecting...');
			setTimeout(() => {
				goto('/login');
				toast.success('Your account was verified successfully!');
			}, 3000);
		} else {
			console.error('❌ Verification failed:', data.error);
		}
	});
</script>

{#if data.success}
	<Alert.Root class="mx-auto mt-6 flex max-w-fit flex-col items-start" variant="info">
		<ShieldCheck class="h-4 w-4" />
		<Alert.Title>Email verified successfully!</Alert.Title>
		<Alert.Description class="text-left">Redirecting to your account...</Alert.Description>
	</Alert.Root>
{:else}
	<Alert.Root class="mx-auto mt-6 flex max-w-fit flex-col items-start" variant="destructive">
		<ShieldX class="h-4 w-4" />
		<Alert.Title>Verification failed</Alert.Title>
		<Alert.Description class="text-left">{data.error}</Alert.Description>
	</Alert.Root>
{/if}
