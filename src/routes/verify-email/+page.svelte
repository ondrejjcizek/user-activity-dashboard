<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Alert from '$lib/components/ui/alert';
	import { MailCheck, ShieldCheck, ShieldX } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	export let data: {
		success: boolean;
		error?: string;
		callbackURL: string;
	};

	console.log(data);

	onMount(() => {
		if (data.success) {
			console.log('✅ Email verified. Redirecting...');
			setTimeout(() => {
				goto('/login');
				toast.success('Your account was verified successfully!');
			}, 1000); // slight delay for session cookie to attach
		} else {
			console.error('❌ Verification failed:', data.error);
		}
	});
</script>

{#if data.success}
	<Alert.Root class="mt-4 max-w-fit flex-col items-center justify-center">
		<ShieldCheck class="h-4 w-4" />
		<Alert.Title class="text-left">Email verified successfully!</Alert.Title>
		<Alert.Description class="text-left text-balance">
			Redirecting to your account...
		</Alert.Description>
	</Alert.Root>
{:else}
	<Alert.Root class="mt-4 max-w-fit flex-col items-center justify-center">
		<ShieldX class="h-4 w-4" />
		<Alert.Title class="text-left">Email verified successfully!</Alert.Title>
		<Alert.Description class="text-left text-balance">
			Redirecting to your account...
		</Alert.Description>
	</Alert.Root>
	<h1>Verification failed</h1>
	<p>{data.error}</p>
{/if}
