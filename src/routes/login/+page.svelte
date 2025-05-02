<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { RegisterUserZodSchema, UserLoginZodSchema } from '$lib/validations/AuthZodSchemas.js';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tabs from '$lib/components/ui/tabs';
	import { CircleAlert, MailOpen, Send } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import * as Alert from '$lib/components/ui/alert';
	import { fade } from 'svelte/transition';
	import { Separator } from '$lib/components/ui/separator';
	import Spinner from '$lib/components/Spinner.svelte';
	import type { PageServerData } from './$types';
	import SuperDebug from 'sveltekit-superforms';

	type Props = {
		data: PageServerData;
		getValue: () => string;
		setValue: (newValue: string) => void;
	};

	const { data, getValue = $bindable(), setValue = $bindable() }: Props = $props();

	const loginForm = superForm(data.loginForm, {
		resetForm: true,
		taintedMessage: null,
		invalidateAll: true,
		validators: zodClient(UserLoginZodSchema),
		onUpdate: async () => {
			console.warn('updateCardeight');
			setTimeout(() => {
				updateCardHeight();
				// invalidateAll();
				// goto('/account');
			}, 100);
		},
		onResult: async ({ result }) => {
			console.log(result);
			if (result.type === 'redirect') {
				// await invalidateAll(); // Refresh session-aware data
				const { data: session } = await authClient.getSession();
				console.log('Session:', session);
				goto('/account'); // ✅ redirect after login
			}
		},
		onError: async ({ result }) => {
			$registerMessage = result.error.message || 'Unknown error';
		},
		// onError: (({ result, message }) => void) | 'apply'

		onSubmit: async ({ formData }) => {
			const email = formData.get('email')?.toString() ?? '';
			const password = formData.get('password')?.toString() ?? '';

			try {
				await signInEmail(email, password);
				goto('/account');
			} catch (err) {
				console.error('🔥 Login error:', err);
				toast.error('Login error');
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
		onUpdate: async () => {
			console.warn('updateCardeight');
			setTimeout(() => {
				updateCardHeight();
			}, 100);
		}
		// onSubmit: async ({ formData }) => {
		// 	const firstName = formData.get('firstName')?.toString() ?? '';
		// 	const lastName = formData.get('lastName')?.toString() ?? '';
		// 	const email = formData.get('email')?.toString() ?? '';
		// 	const password = formData.get('password')?.toString() ?? '';
		// 	try {
		// 		await signUpEmail(firstName, lastName, email, password);
		// 	} catch (err) {
		// 		console.log(err);
		// 		console.error('🔥 Registration error:', { err });
		// 		toast.error('Registration error');
		// 	}
		// },
		// onUpdated: async ({ form }) => {
		// 	console.log(form);
		// 	invalidateAll();
		// 	updateCardHeight();
		// 	$loginDelayed = false;
		// }
	});

	const {
		form: registerUserForm,
		message: registerMessage,
		enhance: registerUserEnhance,
		delayed: registerDelayed
	} = registerForm;

	const signInGithub = async () => {
		await authClient.signIn.social({
			provider: 'github',
			callbackURL: '/account',
			errorCallbackURL: '/login'
		});
	};

	const signInGoogle = async () => {
		await authClient.signIn.social({
			provider: 'google',
			callbackURL: '/account',
			errorCallbackURL: '/login'
		});
	};

	const signUpEmail = async (
		firstName: string,
		lastName: string,
		email: string,
		password: string
	) => {
		await authClient.signUp.email(
			{ email, password, name: `${firstName} ${lastName}`, callbackURL: '/account' },
			{
				onError: (ctx) => {
					if (ctx.error.status === 403) {
						alert('Please verify your email address');
						toast.error('Please verify your email address');
					}
					console.log(ctx);
					toast.error(ctx.error.message);
					// alert(ctx.error.message);
					// console.log(ctx.error);
				}
			}
		);
	};

	export const signInEmail = async (email: string, password: string) => {
		const res = await fetch('/sign-in/email', {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ email, password })
		});

		if (!res.ok) {
			const errorBody = await res.json();
			const message = errorBody?.message || 'Login failed';

			const error = new Error(message);
			(error as any).code = errorBody?.code;
			throw error;
		}
	};

	let activeTab = $state('login');
	let cardHeight = $state('0');
	let contentEl: HTMLElement | null = null;
	let contentElChilds: HTMLElement[] | null = null;

	function updateCardHeight() {
		console.log(activeTab);

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

	$inspect(data);
</script>

<SuperDebug data={$loginUserForm} class="w-full" />

<div class="flex w-full items-center justify-center">
	<div class="flex h-auto w-full items-center justify-center scroll-auto">
		<Card.Root
			class={`card-content w-full max-w-sm overflow-hidden rounded-lg bg-white p-0 shadow-md transition-[height] duration-1000 ease-in-out md:max-w-md md:p-8 dark:border-gray-400 dark:bg-gray-700`}
			style={activeTab === 'register' ? `height: ${cardHeight}` : `height: ${cardHeight}`}
		>
			<Card.Header class="text-center">
				<Card.Title class="text-3xl font-bold">Authentication</Card.Title>
				<Card.Description>Please sign in to continue</Card.Description>
			</Card.Header>

			<Card.Content class="flex flex-col gap-3">
				<!-- Google Sign In -->
				<Button variant="outline" onclick={signInGoogle} class="flex gap-2">
					<img src="/google-mark.svg" alt="" />
					Sign in with Google
				</Button>

				<!-- GitHub Sign In -->
				<Button variant="outline" onclick={signInGithub} class="flex gap-2">
					<img class="flex dark:hidden" src="/github-mark.svg" alt="" />
					<img class="hidden dark:flex" src="/github-mark-white.svg" alt="" />
					Sign in with GitHub
				</Button>
			</Card.Content>

			<Card.Footer class="flex flex-col gap-6 text-center">
				<!-- <p class="text-gray-600 dark:text-white">or</p> -->
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
												{...attrs}
												type="password"
												bind:value={$registerUserForm.password}
												placeholder="••••••••"
											/>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<!-- Create Account Button -->
									<Form.Button class="mt-2 flex w-full gap-4">
										Create account
										{#if $registerDelayed}
											<Spinner />
										{/if}
									</Form.Button>
								</form>
								{#if $registerMessage}
									<Alert.Root class="mt-4">
										<Send class="h-4 w-4" />
										<Alert.Title class="text-left">Success!</Alert.Title>
										<Alert.Description class="text-left text-pretty">
											{$registerMessage.alertText}
										</Alert.Description>
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
												{...attrs}
												type="password"
												bind:value={$loginUserForm.password}
												placeholder="••••••••"
											/>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<!-- Create Account Button -->
									<Form.Button class="mt-2 flex w-full gap-4">
										Log In
										{#if $loginDelayed}
											<Spinner />
										{/if}
									</Form.Button>
								</form>
								{#if $loginMessage}
									<!-- <Alert.Root
										class="mt-6 flex max-w-md gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 shadow-sm"
									>
										<MailOpen class="mt-[2px] h-4 w-4 shrink-0 text-emerald-600" />
										<div class="text-emerald-900">
											<Alert.Description class="mt-0.5 text-sm leading-snug">
												We've sent you a verification link. Please verify your email before logging
												in.
											</Alert.Description>
										</div>
									</Alert.Root>
									<Alert.Root>
										<MailOpen class="mt-[2px] h-4 w-4 shrink-0 text-emerald-600" />
										<Alert.Title>Heads up!</Alert.Title>
										<Alert.Description
											>You can add components to your app using the cli.</Alert.Description
										>
									</Alert.Root>

									<Alert.Root>
										<Alert.Title>Heads up!</Alert.Title>
										<Alert.Description
											>You can add components to your app using the cli.</Alert.Description
										>
									</Alert.Root> -->
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
							<p class="error">Something is taking too long. Please try again.</p>
							<Alert.Root
								class="mt-6 flex max-w-md items-center justify-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 shadow-sm"
							>
								<MailOpen class="mt-[2px] h-5 w-5 shrink-0 text-emerald-600" />
								<div class="text-emerald-900">
									<Alert.Description class="mt-0.5 text-sm leading-snug">
										We've sent you a verification link. Please verify your email before logging in.
									</Alert.Description>
								</div>
							</Alert.Root>
						{/if}
					</Tabs.Content>
				</Tabs.Root>
			</Card.Footer>
		</Card.Root>
	</div>
</div>
