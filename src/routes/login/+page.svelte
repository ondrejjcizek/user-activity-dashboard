<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { RegisterUserZodSchema, UserLoginZodSchema } from '$lib/validations/AuthZodSchemas.js';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Alert from '$lib/components/ui/alert';
	import { Separator } from '$lib/components/ui/separator';
	import Spinner from '$lib/components/Spinner.svelte';
	import { LogIn, MailOpen } from 'lucide-svelte';
	import type { PageServerData } from './$types';

	type Props = {
		data: PageServerData;
		getValue: () => string;
		setValue: (newValue: string) => void;
	};

	const { data, getValue = $bindable(), setValue = $bindable() }: Props = $props();

	let isGoogleSigningIn = $state(false);
	let isGithubSigningIn = $state(false);

	const loginForm = superForm(data.loginForm, {
		resetForm: true,
		taintedMessage: null,
		invalidateAll: true,
		validators: zodClient(UserLoginZodSchema),
		onUpdated: async () => {
			await tick();
			updateCardHeight();
		},
		onResult: async ({ result }) => {
			if (result.type === 'failure') {
				const data = result.data as any;
				const msg = data?.message?.alertText || 'You need to fill in all fields';
				toast.info(msg);
			}

			if (result.type === 'redirect') {
				goto('/account');
			}
		}
	});

	const {
		form: loginUserForm,
		message: loginMessage,
		enhance: baseLoginEnhance,
		delayed: loginDelayed,
		timeout
	} = loginForm;

	const loginUserEnhance = (el: HTMLFormElement) =>
		baseLoginEnhance(el, {
			onResult: async ({ result }) => {
				if (result.type === 'success') {
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}
			}
		});

	const registerForm = superForm(data.registerForm, {
		resetForm: true,
		taintedMessage: null,
		validators: zodClient(RegisterUserZodSchema),
		onUpdated: async () => {
			await tick();
			updateCardHeight();
		},
		onResult: async ({ result }) => {
			if (result.type === 'failure') {
				const data = result.data as any;
				const msg =
					data?.message?.alertText ||
					data?.message?.message ||
					data?.message ||
					'You need to fill in all fields';
				toast.info(msg);
			}
		}
	});

	const {
		form: registerUserForm,
		message: registerMessage,
		enhance: baseRegisterEnhance,
		delayed: registerDelayed
	} = registerForm;

	const registerUserEnhance = (el: HTMLFormElement) =>
		baseRegisterEnhance(el, {
			onResult: async ({ result }) => {
				if (result.type === 'success') {
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}
			}
		});

	const signInGoogle = () => {
		isGoogleSigningIn = true;
		authClient.signIn.social({
			provider: 'google',
			callbackURL: '/account',
			errorCallbackURL: '/login'
		});
	};

	const signInGithub = () => {
		isGithubSigningIn = true;
		authClient.signIn.social({
			provider: 'github',
			callbackURL: '/account',
			errorCallbackURL: '/login'
		});
	};

	let activeTab = $state('login');
	let cardHeight = $state('0');
	let contentEl: HTMLElement | null = null;
	let contentElChilds: HTMLElement[] | null = null;

	function updateCardHeight() {
		const _ = activeTab;
		contentEl = document.querySelector('.card-content');
		if (!contentEl) return;

		const nodeList = contentEl.querySelectorAll(':scope > div');
		contentElChilds = Array.from(nodeList) as HTMLElement[];
		const childrenHeight = contentElChilds.reduce((sum, el) => sum + el.offsetHeight, 0);
		const style = window.getComputedStyle(contentEl);
		const paddingTop = parseFloat(style.paddingTop);
		const paddingBottom = parseFloat(style.paddingBottom);
		const totalHeight = childrenHeight + paddingTop + paddingBottom;

		cardHeight = `${totalHeight}px`;
	}

	$effect(() => {
		updateCardHeight();
		window?.addEventListener('resize', updateCardHeight);
	});
</script>

<div class="flex w-full flex-col items-center justify-center">
	<!-- <h1
		class="my-10 flex flex-col items-center gap-2 text-center text-3xl font-bold tracking-tight md:flex-row"
	>
		<ShieldCheck class="mr-2 h-8 w-8" size={16} />
		User Activity Dashboard
	</h1> -->
	<div class="flex h-auto w-full items-center justify-center scroll-auto">
		<Card.Root
			class={`card-content w-full max-w-sm overflow-hidden p-0 transition-[height] duration-1000 ease-in-out md:max-w-md md:p-8`}
			style={activeTab === 'register' ? `height: ${cardHeight}` : `height: ${cardHeight}`}
		>
			<Card.Header class="text-center">
				<Card.Title class="text-3xl font-bold">Authentication</Card.Title>
				<Card.Description>Please sign in to continue</Card.Description>
			</Card.Header>

			<Card.Content class="flex flex-col gap-3">
				<!-- Google Sign In -->
				<Button
					variant="outline"
					onclick={signInGoogle}
					class="flex gap-2"
					disabled={isGoogleSigningIn}
				>
					{#if isGoogleSigningIn}
						<img src="/google-mark.svg" alt="" />
						Sign in with Google
						<Spinner reverse />
					{:else}
						<img src="/google-mark.svg" alt="" />
						Sign in with Google
					{/if}
				</Button>

				<!-- GitHub Sign In -->
				<Button
					variant="outline"
					onclick={signInGithub}
					class="flex gap-2"
					disabled={isGithubSigningIn}
				>
					{#if isGithubSigningIn}
						<img class="flex dark:hidden" src="/github-mark.svg" alt="" />
						<img class="hidden dark:flex" src="/github-mark-white.svg" alt="" />
						Sign in with GitHub
						<Spinner reverse />
					{:else}
						<img class="flex dark:hidden" src="/github-mark.svg" alt="" />
						<img class="hidden dark:flex" src="/github-mark-white.svg" alt="" />
						Sign in with GitHub
					{/if}
				</Button>
			</Card.Content>

			<Card.Footer class="flex flex-col gap-6 text-center">
				<Separator />
				<h2 class="text-xl font-semibold">E-mail</h2>

				<Tabs.Root class="w-full" bind:value={activeTab}>
					<Tabs.List>
						<Tabs.Trigger value="register">Register</Tabs.Trigger>
						<Tabs.Trigger value="login">Login</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="register" class="ease-out-expo transition-[height] duration-[8000]">
						{#if activeTab === 'register'}
							<div transition:fade={{ duration: 800 }}>
								<form
									class="w-full space-y-4 text-left"
									method="POST"
									use:registerUserEnhance
									action="?/registerForm"
									onsubmit={registerForm.submit}
								>
									<!-- First Name -->
									<Form.Field form={registerForm} name="firstName">
										<Form.Control let:attrs>
											<Form.Label>First Name</Form.Label>
											<Input
												class="text-base"
												{...attrs}
												bind:value={$registerUserForm.firstName}
												placeholder="First Name"
											/>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<!-- Last Name -->
									<Form.Field form={registerForm} name="lastName">
										<Form.Control let:attrs>
											<Form.Label>Last Name</Form.Label>
											<Input
												class="text-base"
												{...attrs}
												bind:value={$registerUserForm.lastName}
												placeholder="Last Name"
											/>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<!-- Email -->
									<Form.Field form={registerForm} name="email">
										<Form.Control let:attrs>
											<Form.Label>Email</Form.Label>
											<Input
												class="text-base"
												{...attrs}
												bind:value={$registerUserForm.email}
												placeholder="you@example.com"
											/>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<!-- Password -->
									<Form.Field form={registerForm} name="password">
										<Form.Control let:attrs>
											<Form.Label>Password</Form.Label>
											<Input
												class="text-base"
												{...attrs}
												type="password"
												bind:value={$registerUserForm.password}
												placeholder="••••••••"
											/>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<!-- Register Button -->
									<Form.Button class="mt-2 flex w-full gap-4" disabled={$registerDelayed}>
										Create account
										{#if $registerDelayed}
											<Spinner />
										{/if}
									</Form.Button>
								</form>
								{#if $registerMessage}
									<Alert.Root class="mt-6 flex flex-col items-start" variant="info">
										<MailOpen class="h-4 w-4 -translate-y-1" />
										<Alert.Title>Check your inbox</Alert.Title>
										<Alert.Description class="text-left"
											>We've sent you a verification link. Please verify your email before logging
											in.</Alert.Description
										>
									</Alert.Root>
								{/if}
							</div>
						{/if}
					</Tabs.Content>
					<Tabs.Content value="login" class="ease-out-expo transition-[height] duration-[600ms]">
						{#if activeTab === 'login'}
							<div transition:fade={{ duration: 800 }}>
								<form
									class="w-full space-y-4 text-left"
									method="POST"
									use:loginUserEnhance
									action="?/loginForm"
									onsubmit={loginForm.submit}
								>
									<!-- Email -->
									<Form.Field form={loginForm} name="email">
										<Form.Control let:attrs>
											<Form.Label>Email</Form.Label>
											<Input
												class="text-base"
												{...attrs}
												bind:value={$loginUserForm.email}
												placeholder="you@example.com"
											/>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<!-- Password -->
									<Form.Field form={loginForm} name="password">
										<Form.Control let:attrs>
											<Form.Label>Password</Form.Label>
											<Input
												class="text-base"
												{...attrs}
												type="password"
												bind:value={$loginUserForm.password}
												placeholder="••••••••"
											/>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<!-- Login Button -->
									<Form.Button class="mt-2 flex w-full gap-2" disabled={$loginDelayed}>
										Log In
										<LogIn size={16} />
										{#if $loginDelayed}
											<Spinner />
										{/if}
									</Form.Button>
								</form>
								{#if $loginMessage}
									<Alert.Root class="mt-6 flex flex-col items-start" variant="info">
										<MailOpen class="h-4 w-4 -translate-y-1" />
										<Alert.Title>Check your inbox</Alert.Title>
										<Alert.Description class="text-left"
											>We've sent you a verification link. Please verify your email before logging
											in.</Alert.Description
										>
									</Alert.Root>
								{/if}
							</div>
						{/if}

						{#if $timeout}
							<Alert.Root class="mt-6 flex flex-col items-start" variant="info">
								<Alert.Title>Weird</Alert.Title>
								<Alert.Description class="text-left"
									>Something is taking too long. Please try again.</Alert.Description
								>
							</Alert.Root>
						{/if}
					</Tabs.Content>
				</Tabs.Root>
			</Card.Footer>
		</Card.Root>
	</div>
</div>
