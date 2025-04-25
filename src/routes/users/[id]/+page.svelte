<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { InferSelectModel } from 'drizzle-orm';
	import type { loginHistory } from '$lib/server/db/schema';

	type ActivityEntry = InferSelectModel<typeof loginHistory>;

	type ActivityResponse = {
		loginsLast30Days: number;
		loginsLast3Days: number;
		lastActive: number | null;
		history: ActivityEntry[];
	};

	let activity: ActivityResponse | null = null;
	let loading = true;
	let error: Error | null = null;

	onMount(async () => {
		try {
			const id = $page.params.id;
			const res = await fetch(`/api/activity/${id}`);
			if (!res.ok) throw new Error('Failed to load');

			activity = await res.json();
		} catch (e) {
			error = e instanceof Error ? e : new Error('Unknown error');
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<p>🔄 Loading activity...</p>
{:else if error}
	<p>❌ Error: {error.message}</p>
{:else if activity}
	<h2>👤 Activity Summary</h2>
	<ul>
		<li>
			🕒 Last active: {activity.lastActive
				? new Date(activity.lastActive).toLocaleString()
				: 'Never'}
		</li>
		<li>🔐 Logins (30d): {activity.loginsLast30Days}</li>
		<li>⚡ Logins (3d): {activity.loginsLast3Days}</li>
	</ul>

	<h3>📄 Login History</h3>
	<table class="mt-4 w-full rounded border border-gray-300 text-sm shadow-sm">
		<thead class="bg-gray-100 text-left">
			<tr>
				<th class="border p-2">📅 Date</th>
				<th class="border p-2">🧠 Device</th>
				<th class="border p-2">🌐 Browser</th>
				<th class="border p-2">📍 IP</th>
			</tr>
		</thead>
		<tbody>
			{#each activity.history as entry}
				<tr>
					<td class="border p-2">{new Date(entry.date).toLocaleString()}</td>
					<td class="border p-2">{entry.device}</td>
					<td class="border p-2">{entry.browser}</td>
					<td class="border p-2">{entry.ip}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}
	th,
	td {
		padding: 0.5rem;
		border: 1px solid #ccc;
		font-size: 0.9rem;
	}
</style>
