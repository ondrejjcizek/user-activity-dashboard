<script lang="ts">
	import type { PageData } from './$types';
	import type { LayoutServerData } from '../$types';
	// import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Mail,
		Calendar,
		Clock,
		Shield,
		Activity,
		AlertCircle,
		LogOut,
		TableProperties,
		ShieldUser,
		ShieldCheck
	} from 'lucide-svelte';
	import { authClient } from '$lib/auth-client';
	import { goto, invalidateAll } from '$app/navigation';
	import Chart from 'chart.js/auto';

	type Props = {
		data: LayoutServerData & PageData;
	};

	const { data }: Props = $props();

	const signOut = async () => {
		await authClient.signOut();

		invalidateAll();
	};

	const formatDate = (date: Date) => {
		return date.toLocaleString();
	};

	const splitName = (fullName: string) => {
		const [firstName = '', lastName = ''] = fullName.split(' ');

		const initials = firstName.charAt(0) + lastName.charAt(0) || 'OČ';

		return initials;
	};

	let canvas: HTMLCanvasElement | null = $state(null);

	import { subDays, format } from 'date-fns';

	const today = new Date();
	const last90Days = Array.from({ length: 30 }, (_, i) =>
		format(subDays(today, 29 - i), 'yyyy-MM-dd')
	);

	let historyMap = Object.fromEntries(last90Days.map((d) => [d, 0]));

	data.activity?.history.forEach((entry) => {
		const dateStr = format(new Date(entry.date), 'yyyy-MM-dd');
		if (historyMap[dateStr] !== undefined) {
			historyMap[dateStr]++;
		}
	});

	const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
	const sliceDays = isMobile ? 30 : 30;

	const chartLabels = Object.keys(historyMap).slice(-sliceDays);
	const chartData = Object.values(historyMap).slice(-sliceDays);

	const backgroundColors = chartData.map((val) =>
		val >= 8 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.2)'
	);

	const pointBackgroundColors = chartData.map((val) =>
		val >= 8 ? 'rgb(239, 68, 68)' : 'rgb(99, 102, 241)'
	);

	$effect(() => {
		if (!canvas || typeof window === 'undefined') return;

		const renderChart = async () => {
			const { default: zoomPlugin } = await import('chartjs-plugin-zoom');
			Chart.register(zoomPlugin);

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
										const label = chartLabels[index];
										return window.innerWidth < 640 ? label.slice(5) : label;
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
									label: function (context) {
										const value = context.raw as number;
										const base = `Logins: ${value}`;
										return value >= 8 ? `${base} ⚠️ Suspicious activity` : base;
									}
								}
							},
							zoom: {
								pan: {
									enabled: true,
									mode: 'x'
								},
								zoom: {
									wheel: { enabled: true },
									pinch: { enabled: true },
									mode: 'x'
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
							}
						}
					}
				});
			}
		};

		renderChart();
	});
</script>

<h1
	class="mb-6 flex flex-col items-center gap-2 text-center text-xl font-bold tracking-tight md:flex-row lg:text-2xl"
>
	<ShieldCheck class="mr-2 h-8 w-8" size={16} />
	User Activity Dashboard
</h1>

<div class="container mx-auto">
	{#if !data.session}
		<div class="bg-destructive/10 flex items-center justify-center rounded-lg p-8">
			<AlertCircle class="text-destructive mr-2 h-5 w-5" />
			<p class="text-destructive font-medium">No active session!</p>
		</div>
	{:else}
		<div class="flex flex-col gap-12">
			<!-- User Profile Card -->
			<Card.Root class="mx-auto w-full max-w-md">
				<Card.Header class="pb-4">
					<div class="relative flex items-start justify-between gap-4">
						<div class="flex flex-wrap gap-4">
							<Avatar.Root class="border-primary/10 h-16 w-16 border-2">
								<Avatar.Image
									src={data.session.user.image || 'https://avatar.iran.liara.run/public/boy'}
									alt={data.session.user.name || 'User'}
								/>
								<Avatar.Fallback class="bg-primary/10 text-primary text-lg font-bold">
									{splitName(data.session.user.name)}
								</Avatar.Fallback>
							</Avatar.Root>
							<div>
								<Card.Title class="text-2xl">{data.session.user.name}</Card.Title>
								<Card.Description class="mt-1 flex items-center">
									<Mail class="text-muted-foreground mr-1.5 h-3.5 w-3.5" />
									{data.session.user.email}
								</Card.Description>
							</div>
							<Badge variant="secondary">
								{#if data.session && data.user}
									<p>You are logged as {data.user.role}</p>
								{/if}
							</Badge>
							{#if data.user?.role === 'Admin'}
								<Button class="" variant="outline" size="sm" onclick={() => goto('/users')}>
									<TableProperties class="mr-2 h-4" size={16} />
									Show All Users
								</Button>
							{/if}
						</div>
						<Button
							class="h-10 min-w-10 cursor-pointer p-0 sm:bottom-[unset]"
							onclick={signOut}
							variant="destructive"
							aria-label="Sign Out"
						>
							<LogOut size={20} />
						</Button>
					</div>
				</Card.Header>
				<Card.Content>
					<h3 class="mb-4 text-lg font-medium">Activity Summary</h3>
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center text-sm">
								<Calendar class="text-muted-foreground mr-2 h-4 w-4" />
								<span class="text-muted-foreground">Joined</span>
							</div>
							<span class="text-xs font-medium md:text-sm"
								>{formatDate(data.activity.createdAt)}</span
							>
						</div>

						<div class="flex items-center justify-between">
							<div class="flex items-center text-sm">
								<Clock class="text-muted-foreground mr-2 h-4 w-4" />
								<span class="text-muted-foreground">Last active</span>
							</div>
							<span class="text-xs font-medium md:text-sm">
								{data.activity.lastActive ? formatDate(data.activity.lastActive) : 'Never'}
							</span>
						</div>

						<Separator />

						<div class="flex items-center justify-between">
							<div class="flex items-center text-sm">
								<Shield class="text-muted-foreground mr-2 h-4 w-4" />
								<span class="text-muted-foreground">Logins (30 days)</span>
							</div>
							<Badge variant="secondary">
								{data.activity.loginsLast30Days}
							</Badge>
						</div>

						<div class="flex items-center justify-between">
							<div class="flex items-center text-sm">
								<Activity class="text-muted-foreground mr-2 h-4 w-4" />
								<span class="text-muted-foreground">Logins (3 days)</span>
							</div>
							<Badge variant="outline" class="bg-primary/10 text-primary border-primary/20">
								{data.activity.loginsLast3Days}
							</Badge>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<div class="w-full overflow-x-auto">
				<canvas
					bind:this={canvas}
					class="h-[300px] w-full max-w-full sm:h-[400px]"
					data-lenis-prevent
				></canvas>
			</div>

			<!-- Login History Card -->
			<!-- <Card.Root class="w-full">
				<Card.Header>
					<Card.Title class="flex items-center">
						<Shield class="mr-2 h-5 w-5" />
						Login History
					</Card.Title>
					<Card.Description>Recent login activity for your account</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="rounded-md border">
						<div class="kokot max-w-[calc(100vw-110px)] overflow-x-scroll">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head class="w-[180px]">
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
									{#each data.activity.history as entry}
										<Table.Row>
											<Table.Cell class="font-medium">
												{formatDate(entry.date)}
											</Table.Cell>
											<Table.Cell>{entry.device}</Table.Cell>
											<Table.Cell>{entry.browser}</Table.Cell>
											<Table.Cell class="font-mono text-xs">{entry.ip}</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
					</div>
				</Card.Content>
			</Card.Root> -->
		</div>
	{/if}
</div>
