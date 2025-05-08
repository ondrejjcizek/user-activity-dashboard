<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { ChevronLeft, Shield, Calendar, Smartphone, Globe, MapPin } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import UserCard from '$lib/components/UserCard.svelte';
	import CustomChart from '$lib/components/CustomChart.svelte';
	import Chart from 'chart.js/auto';
	import { format, subDays } from 'date-fns';
	import type { PageServerData } from '../../routes/users/[id]/$types';
	import { onDestroy } from 'svelte';

	type Props = {
		data: PageServerData;
	};

	const { data }: Props = $props();
	const formatDate = (date: Date | string) => new Date(date).toLocaleString();

	let canvas: HTMLCanvasElement | null = $state(null);
	let chartInstance: Chart<'line'> | null = null;

	const today = new Date();
	const last90Days = Array.from({ length: 30 }, (_, i) =>
		format(subDays(today, 29 - i), 'yyyy-MM-dd')
	);

	let historyMap = Object.fromEntries(last90Days.map((d) => [d, 0]));

	if (data?.activity?.history) {
		data.activity.history.forEach((entry) => {
			const dateStr = format(new Date(entry.date), 'yyyy-MM-dd');
			if (historyMap[dateStr] !== undefined) {
				historyMap[dateStr]++;
			}
		});
	}

	const chartLabels = Object.keys(historyMap);
	const chartData = Object.values(historyMap);
	const isSuspicious = (index: number) => chartData[index] > 65;

	const backgroundColors = chartData.map((_, i) =>
		isSuspicious(i) ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.2)'
	);
	const pointColors = chartData.map((_, i) =>
		isSuspicious(i) ? 'rgb(239, 68, 68)' : 'rgb(99, 102, 241)'
	);

	$effect(() => {
		(async () => {
			if (!canvas || typeof window === 'undefined') return;

			const { default: zoomPlugin } = await import('chartjs-plugin-zoom');
			Chart.register(zoomPlugin);

			if (chartInstance) {
				chartInstance.destroy();
				chartInstance = null;
			}

			chartInstance = new Chart(canvas, {
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
					maintainAspectRatio: true,
					scales: {
						x: {
							ticks: {
								autoSkip: true,
								maxTicksLimit: 12,
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
		})();
	});

	// ✅ cleanup on component destroy
	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}
	});
</script>

<div class="flex w-full flex-col items-center gap-12">
	<UserCard user={data.user} activity={data.activity} />
	<canvas bind:this={canvas} class="h-[200px] w-full max-w-full sm:h-[300px]" data-lenis-prevent
	></canvas>
</div>
