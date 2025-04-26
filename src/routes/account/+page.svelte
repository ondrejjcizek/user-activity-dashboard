<script lang="ts">
	import type { PageData, PageServerData } from './$types';

	type Props = {
		data: PageServerData;
	};

	const { data }: Props = $props();
</script>

{#if !data.session}
	<p>❌ No active session!</p>
{:else}
	<h2 class="mb-4">👤 Activity Summary</h2>
	<ul>
		<li>🧑‍💼 Name: {data.session.user.name}</li>
		<li>📧 Email: {data.session.user.email}</li>
		<li>🕰️ Joined: {new Date(data.activity.createdAt).toLocaleString()}</li>
		<li>
			🕒 Last active: {data.activity.lastActive
				? new Date(data.activity.lastActive).toLocaleString()
				: 'Never'}
		</li>
		<li>🔐 Logins (30d): {data.activity.loginsLast30Days}</li>
		<li>⚡ Logins (3d): {data.activity.loginsLast3Days}</li>
	</ul>

	<h3 class="mt-6">📄 Login History</h3>
	<table class="mt-4 w-full rounded border border-gray-300 text-sm shadow-sm">
		<thead class="text-left">
			<tr>
				<th class="border p-2">📅 Date</th>
				<th class="border p-2">🧠 Device</th>
				<th class="border p-2">🌐 Browser</th>
				<th class="border p-2">📍 IP</th>
			</tr>
		</thead>
		<tbody>
			{#each data.activity.history as entry}
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
