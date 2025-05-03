<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';
	import type { loginHistory } from '$lib/server/db/schema';
	import { subDays, format } from 'date-fns';
	import Chart from 'chart.js/auto';

	type ActivityEntry = InferSelectModel<typeof loginHistory>;

	type ActivityResponse = {
		loginsLast30Days: number;
		loginsLast3Days: number;
		lastActive: number | null;
		history: ActivityEntry[];
	};

	type PageServer = {
		params: {
			id: string;
		};
	};

	type Props = {
		data: PageServer;
	};

	const { data }: Props = $props();

	let activity: ActivityResponse | null = $state(null);
	let loading = $state(true);
	let error: Error | null = $state(null);
	let canvas: HTMLCanvasElement | null = $state(null);

	$effect(() => {
		(async () => {
			try {
				const id = data?.params.id;
				const res = await fetch(`/api/activity/${id}`);
				if (!res.ok) throw new Error('Failed to load');

				activity = await res.json();
			} catch (e) {
				error = e instanceof Error ? e : new Error('Unknown error');
			} finally {
				loading = false;
			}
		})();
	});

	$effect(() => {
		if (!canvas || typeof window === 'undefined') return;

		const renderChart = async () => {
			const { default: zoomPlugin } = await import('chartjs-plugin-zoom');
			Chart.register(zoomPlugin);

			const today = new Date();
			const last90Days = Array.from({ length: 90 }, (_, i) =>
				format(subDays(today, 89 - i), 'yyyy-MM-dd')
			);

			let historyMap = Object.fromEntries(last90Days.map((d) => [d, 0]));
			activity?.history?.forEach((entry) => {
				const dateStr = format(new Date(entry.date), 'yyyy-MM-dd');
				if (historyMap[dateStr] !== undefined) {
					historyMap[dateStr]++;
				}
			});

			const chartLabels = Object.keys(historyMap);
			const chartData = Object.values(historyMap);

			const backgroundColors = chartData.map((val) =>
				val >= 8 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.2)'
			);
			const pointBackgroundColors = chartData.map((val) =>
				val >= 8 ? 'rgb(239, 68, 68)' : 'rgb(99, 102, 241)'
			);

			if (canvas instanceof HTMLCanvasElement) {
				new Chart(canvas, {
					type: 'line',
					data: {
						labels: chartLabels,
						datasets: [
							{
								label: 'Logins per day',
								data: chartData,
								fill: true,
								borderColor: 'rgb(99, 102, 241)',
								backgroundColor: backgroundColors,
								tension: 0.3,
								pointBackgroundColor: pointBackgroundColors,
								pointRadius: 4,
								pointHoverRadius: 6
							}
						]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						scales: {
							x: {
								ticks: {
									callback: (value, index) => {
										return window.innerWidth < 640
											? chartLabels[index].slice(5)
											: chartLabels[index];
									}
								}
							},
							y: {
								beginAtZero: true,
								ticks: {
									stepSize: 1
								}
							}
						},
						plugins: {
							tooltip: {
								callbacks: {
									label: (context) => {
										const value = context.raw as number;
										const base = `Logins: ${value}`;
										return value >= 8 ? `${base} ⚠️ Suspicious activity` : base;
									}
								}
							},
							legend: {
								labels: {
									generateLabels(chart) {
										const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
										return [
											...original,
											{
												text: 'Suspicious activity (≥ 8 logins)',
												fillStyle: 'rgb(239, 68, 68)',
												strokeStyle: 'rgb(239, 68, 68)',
												lineWidth: 2,
												hidden: false,
												index: original.length
											}
										];
									}
								}
							},
							zoom: {
								pan: { enabled: true, mode: 'x' },
								zoom: {
									wheel: { enabled: true },
									pinch: { enabled: true },
									mode: 'x'
								}
							}
						}
					}
				});
			}
		};

		renderChart();
	});
</script>

{#if loading}
	<p>🔄 Loading activity...</p>
{:else if error}
	<p>❌ Error: {error.message}</p>
{:else if activity}
	<div class="mb-6 w-full overflow-x-auto">
		<canvas bind:this={canvas} class="h-[300px] w-full max-w-full sm:h-[400px]"></canvas>
	</div>
	<h2 class="mb-2 text-lg font-semibold">👤 Activity Summary</h2>
	<ul class="mb-6 text-sm">
		<li>
			🕒 Last active: {activity.lastActive
				? new Date(activity.lastActive).toLocaleString()
				: 'Never'}
		</li>
		<li>🔐 Logins (30d): {activity.loginsLast30Days}</li>
		<li>⚡ Logins (3d): {activity.loginsLast3Days}</li>
	</ul>
	<h3 class="text-base font-medium">📄 Login History</h3>
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
