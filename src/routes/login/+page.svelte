<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { RegisterUserZodSchema, UserLoginZodSchema } from '$lib/validations/AuthZodSchemas.js';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { superForm } from 'sveltekit-superforms';
	import * as Card from '$lib/components/ui/card/index.js';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageServerData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Send } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import * as Alert from '$lib/components/ui/alert';
	import { fly } from 'svelte/transition';

	type Props = {
		data: PageServerData;
		getValue: () => string;
		setValue: (newValue: string) => void;
	};

	const { data, getValue = $bindable(), setValue = $bindable() }: Props = $props();

	const loginForm = superForm(data.loginForm, {
		resetForm: true,
		taintedMessage: null,
		validators: zodClient(UserLoginZodSchema),
		onSubmit: async ({ formData }) => {
			try {
				const email = formData.get('email')?.toString() ?? '';
				const password = formData.get('password')?.toString() ?? '';

				await signInEmail(email, password);
			} catch (err) {
				console.error('🔥 Login error:', err);
				toast.error('Login error');
			}
		}
	});

	const { form: loginUserForm, message: loginMessage, enhance: loginUserEnhance } = loginForm;

	const registerForm = superForm(data.registerForm, {
		resetForm: true,
		taintedMessage: null,
		validators: zodClient(RegisterUserZodSchema),
		onSubmit: async ({ formData }) => {
			console.log(formData);
			try {
				const firstName = formData.get('firstName')?.toString() ?? '';
				const lastName = formData.get('lastName')?.toString() ?? '';
				const email = formData.get('email')?.toString() ?? '';
				const password = formData.get('password')?.toString() ?? '';

				await signUpEmail(firstName, lastName, email, password);
			} catch (err) {
				console.error('🔥 Login error:', err);
				toast.error('Login error');
			}
		}
	});

	const {
		form: registerUserForm,
		message: registerMessage,
		enhance: registerUserEnhance
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
			{
				email,
				password,
				name: `${firstName} ${lastName}`,
				callbackURL: '/account'
			},
			{
				onError: (ctx) => {
					alert(ctx.error.message);
				}
			}
		);
	};

	const signInEmail = async (email: string, password: string) => {
		await authClient.signIn.email(
			{
				email,
				password,
				callbackURL: '/account'
			},
			{
				onError: (ctx) => {
					if (ctx.error.status === 403) {
						alert('Please verify your email address');
					}
					alert(ctx.error.message);
					console.log(ctx.error);
				},
				onSuccess: (ctx) => {
					invalidateAll();
				}
			}
		);
	};

	let activeTab = $state('login');
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<Card.Root
		class={`w-full max-w-md overflow-hidden rounded-lg bg-white p-8 shadow-md transition-[height] duration-1000 ease-in-out dark:bg-black ${
			activeTab === 'register' ? 'h-[803px]' : 'h-[651px]'
		}`}
	>
		<!-- {#if data.session}
			<Card.Header class="text-center">
				<Card.Title class="text-2xl font-semibold text-gray-800">Welcome</Card.Title>
				<Card.Description>
					<div class="flex items-center justify-center gap-4">
						<img
							src={data.session?.user.image}
							alt={data.session?.user.name}
							class={`h-12 w-12 rounded-full ${data.session?.user.image ? '' : 'hidden'}`}
						/>
						<p class="text-lg text-gray-600">{data.session?.user.name}</p>
					</div>
				</Card.Description>
			</Card.Header>

			<Card.Footer class="flex justify-center">
				<button
					onclick={signOut}
					class="mt-6 rounded-md bg-red-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none"
				>
					Sign out
				</button>
			</Card.Footer>
		{:else} -->
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
			<p class="text-gray-600">or</p>
			<h2 class="text-2xl font-semibold">E-mail</h2>

			<Tabs.Root class="w-full" bind:value={activeTab}>
				<Tabs.List>
					<Tabs.Trigger value="register">Register</Tabs.Trigger>
					<Tabs.Trigger value="login">Login</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="register" class="transition-[height] duration-1000 ease-in-out">
					{#key activeTab}
						<div transition:fly={{ x: -800, duration: 1000 }} class="relative">
							<form
								class="absolute top-0 w-full space-y-4 text-left"
								method="POST"
								use:registerUserEnhance
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
								<Form.Button class="mt-2 w-full">Create account</Form.Button>
							</form>
							{#if $registerMessage}
								<Alert.Root class="">
									<Send class="h-4 w-4" />
									<Alert.Title class="text-left">Success!</Alert.Title>
									<Alert.Description class="text-left text-balance">
										{$registerMessage.alertText}
									</Alert.Description>
								</Alert.Root>
							{/if}
						</div>
					{/key}
				</Tabs.Content>
				<Tabs.Content value="login">
					{#key activeTab}
						<div transition:fly={{ x: 800, duration: 1000 }} class="relative">
							<form
								class="absolute top-0 w-full space-y-4 text-left"
								method="POST"
								use:loginUserEnhance
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
								<Form.Button class="mt-2 w-full">Log In</Form.Button>
							</form>
							{#if $loginMessage}
								<Alert.Root class="mt-4 flex-col items-center justify-center">
									<Send class="h-4 w-4" />
									<Alert.Title class="text-left">Success!</Alert.Title>
									<Alert.Description class="text-left text-balance">
										{$loginMessage.alertText}
									</Alert.Description>
								</Alert.Root>
							{/if}
						</div>
					{/key}
				</Tabs.Content>
			</Tabs.Root>
		</Card.Footer>
		<!-- {/if} -->
	</Card.Root>
</div>

<style>
</style>
