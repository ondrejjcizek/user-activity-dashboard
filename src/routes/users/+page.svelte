<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import {
		Shield,
		Mail,
		UserCheck,
		Calendar,
		Trash,
		ChevronLeft,
		Eye,
		Search,
		BookUser
	} from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import Chart from 'chart.js/auto';
	import { subDays, format } from 'date-fns';
	import { Input } from '$lib/components/ui/input';
	import { goto, preloadData, pushState } from '$app/navigation';
	import Fuse from 'fuse.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { page } from '$app/state';
	import UserDetailPage from './[id]/+page.svelte';
	import { lenisStore as lenis } from '$lib/stores/lenis';

	type Props = {
		data: PageServerData;
	};

	type LoginEntry = {
		id: string;
		date: Date;
		device: string;
		browser: string;
		ip: string;
		userId: string;
	};

	type User = {
		id: string;
		name: string;
		email: string;
		createdAt: Date;
		updatedAt: Date;
		status: string | null;
		role: string | null;
		loginHistory?: LoginEntry[];
		suspicious?: boolean;
	};

	const { data }: Props = $props();
	const formatDate = (date: Date) => new Date(date).toLocaleDateString();
	let canvas: HTMLCanvasElement | null = $state(null);
	let chartInstance: Chart | null = null;
	let search = $state('');
	let isDrawerOpen = $state(false);

	const fuse = new Fuse(data.users as User[], {
		keys: ['name', 'email'],
		threshold: 0.3
	});

	const filteredUsers = $derived(() => {
		const q = search.toLowerCase();
		return q ? fuse.search(q).map((r) => r.item) : (data.users as User[]);
	});

	const today = new Date();
	const last90Days = Array.from({ length: 90 }, (_, i) =>
		format(subDays(today, 89 - i), 'yyyy-MM-dd')
	);

	let historyMap = Object.fromEntries(last90Days.map((d) => [d, 0]));
	const allLogins: LoginEntry[] = (data.users as User[]).flatMap((user) => user.loginHistory ?? []);

	allLogins.forEach((entry) => {
		const dateStr = format(new Date(entry.date), 'yyyy-MM-dd');
		if (historyMap[dateStr] !== undefined) {
			historyMap[dateStr]++;
		}
	});

	const chartLabels = Object.keys(historyMap);
	const chartData = Object.values(historyMap);
	const isSuspicious = (index: number) => chartData[index] > 65;

	const backgroundColors = chartData.map((_, i) =>
		isSuspicious(i) ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.2)'
	);
	const pointColors = chartData.map((_, i) =>
		isSuspicious(i) ? 'rgb(239, 68, 68)' : 'rgb(99, 102, 241)'
	);

	// Shallow Routing
	async function openDrawer(userId: string, event: MouseEvent) {
		event.preventDefault();

		const href = `/users/${userId}`;
		const result = await preloadData(href);

		if (result.type === 'loaded' && result.status === 200) {
			isDrawerOpen = true;
			$lenis?.stop();
			pushState(href, {
				selected: result.data as import('./[id]/$types').PageServerData
			});
		} else {
			goto(href);
		}
	}

	$effect(() => {
		if (!canvas || typeof window === 'undefined') return;

		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}

		import('chartjs-plugin-zoom').then(({ default: zoomPlugin }) => {
			Chart.register(zoomPlugin);

			chartInstance = new Chart(canvas!, {
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
							pointRadius: 3,
							pointHoverRadius: 6
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: {
						y: {
							beginAtZero: true,
							ticks: { stepSize: 1 }
						},
						x: {
							ticks: {
								callback: (_, i) =>
									window.innerWidth < 640 ? chartLabels[i].slice(5) : chartLabels[i]
							}
						}
					},
					plugins: {
						tooltip: {
							callbacks: {
								label: (ctx) => {
									const i = ctx.dataIndex;
									const v = ctx.raw as number;
									return isSuspicious(i) ? `Logins: ${v} ⚠️ Suspicious` : `Logins: ${v}`;
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

	function closeDrawer() {
		isDrawerOpen = false;
		$lenis?.start();
		history.back();
	}
</script>

{#if page.state.selected}
	<Drawer.Root open={isDrawerOpen} onClose={closeDrawer}>
		<Drawer.Content class="px-6">
			<UserDetailPage data={page.state.selected} />
		</Drawer.Content>
	</Drawer.Root>
{/if}

<Button class="absolute top-4 left-4" variant="outline" size="sm" onclick={() => goto('/account')}>
	<ChevronLeft class="mr-2 h-4" size={16} />
	Back to Account
</Button>

<h1
	class="my-10 flex flex-col items-center gap-2 text-center text-3xl font-bold tracking-tight md:flex-row"
>
	<Shield class="mr-2 h-7 w-7" size={24} />
	User Accounts
</h1>

<div class="w-full overflow-x-auto pb-8">
	<canvas bind:this={canvas} class="h-[300px] w-full max-w-full"></canvas>
</div>

<Card.Root class="w-full">
	<Card.Header class="flex flex-row flex-wrap items-center justify-between gap-3">
		<div class="flex flex-col gap-1">
			<Card.Title class="flex flex-col items-center gap-2 text-center md:flex-row">
				<BookUser class="mr-2 h-5 w-5" />
				All users registered in the system
			</Card.Title>
		</div>
		<div class="relative w-full max-w-md">
			<Search
				class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
			/>
			<Input
				placeholder="Search by name or email..."
				id="userSearch"
				bind:value={search}
				class="bg-white pl-10 dark:bg-black"
			/>
		</div>
	</Card.Header>
	<Card.Content>
		<div class="overflow-x-auto rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head><UserCheck class="mr-2 inline-block h-4 w-4" />Name</Table.Head>
						<Table.Head><Mail class="mr-2 inline-block h-4 w-4" />Email</Table.Head>
						<Table.Head>Role</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head><Calendar class="mr-2 inline-block h-4 w-4" />Joined</Table.Head>
						<Table.Head colspan={2}>Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredUsers() as user (user.id)}
						<Table.Row class={user.suspicious ? 'bg-red-50 font-semibold dark:bg-red-400' : ''}>
							<Table.Cell class="font-medium">{user.name}</Table.Cell>
							<Table.Cell>{user.email}</Table.Cell>
							<Table.Cell>{user.role}</Table.Cell>
							<Table.Cell>{user.status}</Table.Cell>
							<Table.Cell>{formatDate(user.createdAt)}</Table.Cell>
							<Table.Cell>
								<Button
									class="h-10 w-10 pt-0 pr-0 pb-0 pl-0"
									onclick={(e: MouseEvent) => openDrawer(user.id, e)}
								>
									<Eye size={20} />
								</Button>
							</Table.Cell>
							<Table.Cell class="flex gap-2">
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={user.id} />
									<Button
										class="h-10 w-10 cursor-pointer p-0"
										type="submit"
										variant="destructive"
										aria-label="Delete User"
									>
										<Trash size={20} />
									</Button>
								</form>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</Card.Content>
</Card.Root>
