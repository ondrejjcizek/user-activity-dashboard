<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '@/auth-client';
	import { toast } from 'svelte-sonner';
	import type { PageServerData } from './$types';

	type Props = { data: PageServerData };
	const { data }: Props = $props();

	let redirecting = $state(false);

	$inspect({ data, redirecting });

	$effect(() => {
		async () => {
			console.log('🚀 Effect triggered', data);

			// 1. Activation just happened
			if (data?.success && data?.role === 'user') {
				console.log('✅ Activation success - refreshing session...');
				redirecting = true;
				toast.success('Account activated successfully! 🎉');

				await authClient.getSession({ query: { disableCookieCache: true } });

				setTimeout(() => {
					goto('/account');
				}, 1500);
				return;
			}

			// 2. Already verified
			if (data?.alreadyVerified) {
				console.log('🔵 Already verified - refreshing session...');
				redirecting = true;
				toast.info('Account was already verified! 📋');

				await authClient.getSession({ query: { disableCookieCache: true } });

				setTimeout(() => {
					goto('/account');
				}, 1500);
				return;
			}

			// 3. Existing session
			const { data: currentSession } = await authClient.getSession();
			if (currentSession) {
				console.log('✅ Session active - redirecting immediately...');
				redirecting = true;
				toast.success('Activated and logged in! ✅');

				setTimeout(() => {
					goto('/account');
				}, 1500);
				return;
			}

			// 4. Error fallback
			if (data?.error) {
				console.log('❌ Activation error:', data.error);
				toast.error(`Activation failed: ${data.error}`);
			}

			console.log('🛑 No valid session or activation yet.');
		};
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
