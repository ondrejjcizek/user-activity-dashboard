<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Shield, Mail, UserCheck, Calendar, Trash } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { buttonVariants } from '$lib/components/ui/button';

	type Props = {
		data: PageServerData;
	};

	const { data }: Props = $props();

	const formatDate = (date: Date) => new Date(date).toLocaleDateString();
</script>

<Card.Root class="w-full">
	<Card.Header>
		<Card.Title class="flex items-center">
			<Shield class="mr-2 h-5 w-5" />
			User Accounts
		</Card.Title>
		<Card.Description>All users registered in the system</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="rounded-md border">
			<div class="max-w-[calc(100vw-110px)] overflow-x-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>
								<div class="flex items-center">
									<UserCheck class="mr-2 h-4 w-4" />
									Name
								</div>
							</Table.Head>
							<Table.Head>
								<div class="flex items-center">
									<Mail class="mr-2 h-4 w-4" />
									Email
								</div>
							</Table.Head>
							<Table.Head>
								<div class="flex items-center">Role</div>
							</Table.Head>
							<Table.Head>
								<div class="flex items-center">Status</div>
							</Table.Head>
							<Table.Head>
								<div class="flex items-center">
									<Calendar class="mr-2 h-4 w-4" />
									Joined
								</div>
							</Table.Head>
							<Table.Head>
								<div class="flex items-center">Actions</div>
							</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data?.users as user (user.id)}
							<Table.Row>
								<Table.Cell class="font-medium">{user.name}</Table.Cell>
								<Table.Cell>{user.email}</Table.Cell>
								<Table.Cell>{user.role}</Table.Cell>
								<Table.Cell>{user.status}</Table.Cell>
								<Table.Cell>{formatDate(user.createdAt)}</Table.Cell>
								<Table.Cell>
									<a href={`/users/${user.id}`} class={buttonVariants({ variant: 'link' })}>
										View
									</a>
								</Table.Cell>
								<Table.Cell class="flex gap-2">
									<form method="POST" action="?/delete" use:enhance>
										<input type="hidden" name="id" value={user.id} />
										<Button
											class="flex h-6 cursor-pointer py-4"
											type="submit"
											variant="destructive"
											aria-label="Sign Out"><Trash /></Button
										>
									</form>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	</Card.Content>
</Card.Root>
