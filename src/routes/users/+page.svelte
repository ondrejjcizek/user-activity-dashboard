<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Shield, Mail, UserCheck, Calendar, Trash, ChevronLeft, Eye } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { buttonVariants } from '$lib/components/ui/button';
	import Chart from 'chart.js/auto';
	import { subDays, format } from 'date-fns';
	import { Input } from '$lib/components/ui/input';
	import { goto } from '$app/navigation';
	import Fuse from 'fuse.js';

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
	let search = $state('');

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
									return isSuspicious(i) ? `Logins: ${v} \u26A0\uFE0F Suspicious` : `Logins: ${v}`;
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

<Button class="absolute top-4 left-4" variant="outline" size="sm" onclick={() => goto('/account')}>
	<ChevronLeft class="h-4" />
	Back to Account
</Button>

<h1 class="text-1xl my-4 font-semibold uppercase">All users registered in the system</h1>

<div class="w-full overflow-x-auto pb-8">
	<canvas bind:this={canvas} class="h-[300px] w-full max-w-full"></canvas>
</div>

<Card.Root class="w-full">
	<Card.Header class="flex flex-row items-center justify-between">
		<div class="flex flex-col gap-1">
			<Card.Title class="flex items-center">
				<Shield class="mr-2 h-5 w-5" />
				User Accounts
			</Card.Title>
			<Card.Description>All users registered in the system</Card.Description>
		</div>
		<Input
			placeholder="Search by name or email..."
			id="user"
			bind:value={search}
			class="max-w-sm bg-white dark:bg-black"
		/>
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
								<a
									href={`/users/${user.id}`}
									class={`${buttonVariants({ variant: 'default' })} h-10 w-10 pt-0 pr-0 pb-0 pl-0`}
								>
									<Eye size={20} />
								</a>
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
