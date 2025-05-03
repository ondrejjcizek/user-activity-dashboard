<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		Calendar,
		Clock,
		Shield,
		Activity,
		Smartphone,
		Globe,
		MapPin,
		ChevronLeft
	} from 'lucide-svelte';
	import Chart from 'chart.js/auto';
	import { format, subDays } from 'date-fns';
	import UserCard from '$lib/components/UserCard.svelte';
	import type { PageServerData } from './$types';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		data: PageServerData;
	};

	const { data }: Props = $props();

	const formatDate = (date: Date | string) => new Date(date).toLocaleString();

	let canvas: HTMLCanvasElement | null = $state(null);

	const today = new Date();
	const last90Days = Array.from({ length: 90 }, (_, i) =>
		format(subDays(today, 89 - i), 'yyyy-MM-dd')
	);

	let historyMap = Object.fromEntries(last90Days.map((d) => [d, 0]));

	data.activity?.history.forEach((entry) => {
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
	const pointColors = chartData.map((val) => (val >= 8 ? 'rgb(239, 68, 68)' : 'rgb(99, 102, 241)'));

	$effect(() => {
		if (!canvas || typeof window === 'undefined') return;
		import('chartjs-plugin-zoom').then(({ default: zoomPlugin }) => {
			Chart.register(zoomPlugin);
			new Chart(canvas!, {
				type: 'line',
				data: {
					labels: chartLabels,
					datasets: [
						{
							label: 'Logins per day',
							data: chartData,
							borderColor: 'rgb(99, 102, 241)',
							backgroundColor: backgroundColors,
							fill: true,
							tension: 0.3,
							pointBackgroundColor: pointColors,
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
								callback: (_, i) =>
									window.innerWidth < 640 ? chartLabels[i].slice(5) : chartLabels[i]
							}
						},
						y: {
							beginAtZero: true,
							ticks: { stepSize: 1 }
						}
					},
					plugins: {
						tooltip: {
							callbacks: {
								label: (ctx) => {
									const v = ctx.raw as number;
									return v >= 8 ? `Logins: ${v} ⚠️ Suspicious activity` : `Logins: ${v}`;
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
							zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
						}
					}
				}
			});
		});
	});
</script>

<div class="flex flex-col items-center gap-12">
	<Button class="absolute top-4 left-4" variant="outline" size="sm" onclick={() => goto('/users')}>
		<ChevronLeft class="h-4" />
		Back to Users
	</Button>

	<UserCard user={data.user} activity={data.activity} />

	<div class="w-full overflow-x-auto">
		<canvas bind:this={canvas} class="h-[300px] w-full max-w-full sm:h-[400px]"></canvas>
	</div>

	<!-- <Card.Root class="w-full">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Shield class="h-5 w-5" />
				Login History
			</Card.Title>
			<Card.Description>Detailed login events</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="rounded-md border">
				<div class="max-w-[calc(100vw-110px)] overflow-x-auto">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>
									<div class="flex items-center">
										<Calendar class="mr-2 h-4 w-4" />
										Date
									</div>
								</Table.Head>
								<Table.Head>
									<div class="flex items-center">
										<Smartphone class="mr-2 h-4 w-4" />
										Device
									</div>
								</Table.Head>
								<Table.Head>
									<div class="flex items-center">
										<Globe class="mr-2 h-4 w-4" />
										Browser
									</div>
								</Table.Head>
								<Table.Head>
									<div class="flex items-center">
										<MapPin class="mr-2 h-4 w-4" />
										IP
									</div>
								</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#if data.activity}
								{#each data.activity.history as entry (entry.date + entry.ip)}
									<Table.Row>
										<Table.Cell>{formatDate(entry.date)}</Table.Cell>
										<Table.Cell>{entry.device}</Table.Cell>
										<Table.Cell>{entry.browser}</Table.Cell>
										<Table.Cell class="font-mono text-xs">{entry.ip}</Table.Cell>
									</Table.Row>
								{/each}
							{/if}
						</Table.Body>
					</Table.Root>
				</div>
			</div>
		</Card.Content>
	</Card.Root> -->
</div>
