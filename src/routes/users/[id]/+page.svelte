<script lang="ts">
	import { ChevronLeft } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import type { PageServerData } from './$types';
	import UserDetailContent from '$lib/components/UserDetailContent.svelte';
	import { page } from '$app/state';

	type Props = {
		data: PageServerData;
	};

	const { data }: Props = $props();
</script>

<div class="mx-auto my-12 flex w-full max-w-2xl flex-col items-center gap-12">
	{#if page.url.pathname !== '/users'}
		<Button variant="outline" size="sm" onclick={() => goto('/users')}>
			<ChevronLeft class="mr-2 h-4" size={16} />
			Back to Users
		</Button>
	{/if}

	<UserDetailContent {data} />
</div>
