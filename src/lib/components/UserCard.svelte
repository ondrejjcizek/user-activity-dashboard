<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Mail, Calendar, Clock, Shield, Activity } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';

	type Props = {
		user: {
			name: string;
			email: string;
			image?: string | null;
			role?: string | null;
		};
		activity?: {
			createdAt: Date;
			lastActive?: Date | number | null;
			loginsLast30Days: number;
			loginsLast3Days: number;
		};
	};

	const { user, activity }: Props = $props();

	const formatDate = (date: Date) => date.toLocaleString();

	const splitName = (name: string) => {
		const [first = '', last = ''] = name.split(' ');
		return (first[0] + (last[0] || '')).toUpperCase();
	};

	const signOut = async () => {
		await authClient.signOut();
		invalidateAll();
	};
</script>

<Card.Root class="mx-auto w-full max-w-md">
	<Card.Header class="pb-4">
		<div class="flex items-start justify-between gap-4">
			<div class="flex flex-wrap gap-4">
				<Avatar.Root class="border-primary/10 h-16 w-16 border-2">
					<Avatar.Image
						src={user.image ?? 'https://avatar.iran.liara.run/public/boy'}
						alt={user.name || 'User'}
					/>
					<Avatar.Fallback class="bg-primary/10 text-primary text-lg font-bold">
						{splitName(user.name)}
					</Avatar.Fallback>
				</Avatar.Root>
				<div>
					<Card.Title class="text-2xl">{user.name}</Card.Title>
					<Card.Description class="mt-1 flex items-center">
						<Mail class="text-muted-foreground mr-1.5 h-3.5 w-3.5" />
						{user.email}
					</Card.Description>
				</div>
			</div>
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
				<span class="text-xs font-medium md:text-sm">
					{activity?.createdAt ? formatDate(activity.createdAt) : '—'}
				</span>
			</div>

			<div class="flex items-center justify-between">
				<div class="flex items-center text-sm">
					<Clock class="text-muted-foreground mr-2 h-4 w-4" />
					<span class="text-muted-foreground">Last active</span>
				</div>
				<span class="text-xs font-medium md:text-sm">
					{activity?.lastActive ? formatDate(new Date(activity.lastActive)) : 'Never'}
				</span>
			</div>

			<hr class="border-muted/30 my-2" />

			<div class="flex items-center justify-between">
				<div class="flex items-center text-sm">
					<Shield class="text-muted-foreground mr-2 h-4 w-4" />
					<span class="text-muted-foreground">Logins (30 days)</span>
				</div>
				<Badge variant="secondary">{activity?.loginsLast30Days ?? 0}</Badge>
			</div>

			<div class="flex items-center justify-between">
				<div class="flex items-center text-sm">
					<Activity class="text-muted-foreground mr-2 h-4 w-4" />
					<span class="text-muted-foreground">Logins (3 days)</span>
				</div>
				<Badge variant="outline" class="bg-primary/10 text-primary border-primary/20">
					{activity?.loginsLast3Days ?? 0}
				</Badge>
			</div>
		</div>
	</Card.Content>
</Card.Root>
