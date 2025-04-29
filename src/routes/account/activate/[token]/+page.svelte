<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import type { PageServerData } from './$types';

	type Props = { data: PageServerData };
	const { data }: Props = $props();

	let redirecting = $state(false);

	// $inspect({ data, redirecting });

	$effect(() => {
		const run = async () => {
			console.log('🚀 Effect triggered', data);

			if (data?.success && data?.role === 'user') {
				console.log('✅ Activation success!');
				redirecting = true;
				toast.success('Account activated successfully!');

				// maybe optionally refresh session, but do not block
				authClient.getSession({ query: { disableCookieCache: true } }).catch(console.error);
				// await invalidateAll();

				goto('/account');
				return;
			}

			if (data?.alreadyVerified) {
				console.log('🔵 Already verified!');
				redirecting = true;
				toast.info('Account was already verified!');

				authClient.getSession({ query: { disableCookieCache: true } }).catch(console.error);
				// await invalidateAll();

				goto('/account');
				return;
			}

			// If here, show error
			if (data?.error) {
				console.log('❌ Activation error:', data.error);
				toast.error(`Activation failed: ${data.error}`);
			}

			console.log('🛑 No valid session or activation yet.');
		};
		run();
	});
</script>

{#if redirecting}
	<div class="flex min-h-[50vh] flex-col items-center justify-center">
		<p class="mb-4 text-lg font-semibold text-blue-500">🔄 Přesměrovávám na účet…</p>
	</div>
{:else if data?.error}
	<div class="flex min-h-[50vh] flex-col items-center justify-center">
		<p class="mb-4 text-lg font-semibold text-red-600">❌ {data.error}</p>
	</div>
{:else}
	<div class="flex min-h-[50vh] flex-col items-center justify-center">
		<p class="mb-4 text-lg font-semibold">⏳ Aktivujeme účet…</p>
		<div
			class="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent"
		></div>
	</div>
{/if}
