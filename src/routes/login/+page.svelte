<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { RegisterUserZodSchema } from '$lib/validations/AuthZodSchemas.js';
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import type { PageServerData } from './$types.js';

	type Props = {
		data: PageServerData;
	};

	const { data }: Props = $props();

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

	const signUpEmail = async () => {
		await authClient.signUp.email(
			{
				email: 'ondrejj.cizek@icloud.com',
				password: 'password1234',
				name: 'ondrejjcizek',
				callbackURL: '/account'
			},
			{
				onError: (ctx) => {
					alert(ctx.error.message);
				}
			}
		);
	};

	const signInEmail = async () => {
		await authClient.signIn.email(
			{
				email: 'ondrejj.cizek@icloud.com',
				password: 'password1234',
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

	const signOut = async () => {
		await authClient.signOut();

		invalidateAll();
	};

	const {
		enhance: registerUserEnhance,
		form: registerUserForm,
		errors: registerUserErrors,
		message: registerMessage
	} = superForm(data.form, {
		resetForm: true,
		taintedMessage: null,
		validators: zod(RegisterUserZodSchema),
		onSubmit: async ({ formData }) => {
			setTimeout(() => {
				$registerMessage = '';
			}, 2000);
		}
	});

	const session = authClient.useSession;

	$effect(() => {
		const session = authClient.useSession;
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
		{#if data.session}
			<div class="text-center">
				<h2 class="mb-4 text-2xl font-semibold text-gray-800">Welcome</h2>
				<div class="flex items-center justify-center gap-4">
					<img
						src={data.session?.user.image}
						alt={data.session?.user.name}
						class={`h-12 w-12 rounded-full ${data.session?.user.image ? '' : 'hidden'}`}
					/>
					<p class="text-lg text-gray-600">{data.session?.user.name}</p>
				</div>
				<button
					onclick={signOut}
					class="mt-6 rounded-md bg-red-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none"
				>
					Sign out
				</button>
			</div>
		{:else}
			<div class="flex flex-col gap-3 text-center">
				<h2 class="text-2xl font-semibold text-gray-800">Authentication</h2>
				<p class="mb-6 text-gray-600">Please sign in to continue</p>
				<div class="flex gap-3">
					<button
						onclick={signInGithub}
						class="inline-flex w-full items-center justify-center rounded-md bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none"
					>
						<svg
							class="mr-2"
							width="24px"
							height="24px"
							viewBox="0 0 20 20"
							version="1.1"
							xmlns="http://www.w3.org/2000/svg"
							xmlns:xlink="http://www.w3.org/1999/xlink"
							fill="#ffffff"
							stroke="#ffffff"
							><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
								id="SVGRepo_tracerCarrier"
								stroke-linecap="round"
								stroke-linejoin="round"
							></g><g id="SVGRepo_iconCarrier">
								<title>github [#ffffff]</title> <desc>Created with Sketch.</desc> <defs> </defs>
								<g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
									<g
										id="Dribbble-Light-Preview"
										transform="translate(-140.000000, -7559.000000)"
										fill="#ffffff"
									>
										<g id="icons" transform="translate(56.000000, 160.000000)">
											<path
												d="M94,7399 C99.523,7399 104,7403.59 104,7409.253 C104,7413.782 101.138,7417.624 97.167,7418.981 C96.66,7419.082 96.48,7418.762 96.48,7418.489 C96.48,7418.151 96.492,7417.047 96.492,7415.675 C96.492,7414.719 96.172,7414.095 95.813,7413.777 C98.04,7413.523 100.38,7412.656 100.38,7408.718 C100.38,7407.598 99.992,7406.684 99.35,7405.966 C99.454,7405.707 99.797,7404.664 99.252,7403.252 C99.252,7403.252 98.414,7402.977 96.505,7404.303 C95.706,7404.076 94.85,7403.962 94,7403.958 C93.15,7403.962 92.295,7404.076 91.497,7404.303 C89.586,7402.977 88.746,7403.252 88.746,7403.252 C88.203,7404.664 88.546,7405.707 88.649,7405.966 C88.01,7406.684 87.619,7407.598 87.619,7408.718 C87.619,7412.646 89.954,7413.526 92.175,7413.785 C91.889,7414.041 91.63,7414.493 91.54,7415.156 C90.97,7415.418 89.522,7415.871 88.63,7414.304 C88.63,7414.304 88.101,7413.319 87.097,7413.247 C87.097,7413.247 86.122,7413.234 87.029,7413.87 C87.029,7413.87 87.684,7414.185 88.139,7415.37 C88.139,7415.37 88.726,7417.2 91.508,7416.58 C91.513,7417.437 91.522,7418.245 91.522,7418.489 C91.522,7418.76 91.338,7419.077 90.839,7418.982 C86.865,7417.627 84,7413.783 84,7409.253 C84,7403.59 88.478,7399 94,7399"
												id="github-[#ffffff]"
											>
											</path>
										</g>
									</g>
								</g>
							</g></svg
						>
						Sign in with GitHub
					</button>
				</div>
				<div class="flex">
					<button
						onclick={signInGoogle}
						class="inline-flex w-full items-center justify-center rounded-md bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none"
					>
						<svg
							class="mr-2"
							fill="#ffffff"
							width="24px"
							height="24px"
							viewBox="0 0 512 512"
							xmlns="http://www.w3.org/2000/svg"
							stroke="#ffffff"
							><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
								id="SVGRepo_tracerCarrier"
								stroke-linecap="round"
								stroke-linejoin="round"
							></g><g id="SVGRepo_iconCarrier"
								><title>ionicons-v5_logos</title><path
									d="M473.16,221.48l-2.26-9.59H262.46v88.22H387c-12.93,61.4-72.93,93.72-121.94,93.72-35.66,0-73.25-15-98.13-39.11a140.08,140.08,0,0,1-41.8-98.88c0-37.16,16.7-74.33,41-98.78s61-38.13,97.49-38.13c41.79,0,71.74,22.19,82.94,32.31l62.69-62.36C390.86,72.72,340.34,32,261.6,32h0c-60.75,0-119,23.27-161.58,65.71C58,139.5,36.25,199.93,36.25,256S56.83,369.48,97.55,411.6C141.06,456.52,202.68,480,266.13,480c57.73,0,112.45-22.62,151.45-63.66,38.34-40.4,58.17-96.3,58.17-154.9C475.75,236.77,473.27,222.12,473.16,221.48Z"
								></path></g
							></svg
						>
						Sign in with Google
					</button>
				</div>
				<div class="flex">
					<button
						onclick={signUpEmail}
						class="inline-flex w-full items-center justify-center rounded-md bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none"
					>
						<svg
							class="mr-2"
							fill="#ffffff"
							width="24px"
							height="24px"
							viewBox="0 0 512 512"
							xmlns="http://www.w3.org/2000/svg"
							stroke="#ffffff"
							><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
								id="SVGRepo_tracerCarrier"
								stroke-linecap="round"
								stroke-linejoin="round"
							></g><g id="SVGRepo_iconCarrier"
								><title>ionicons-v5_logos</title><path
									d="M473.16,221.48l-2.26-9.59H262.46v88.22H387c-12.93,61.4-72.93,93.72-121.94,93.72-35.66,0-73.25-15-98.13-39.11a140.08,140.08,0,0,1-41.8-98.88c0-37.16,16.7-74.33,41-98.78s61-38.13,97.49-38.13c41.79,0,71.74,22.19,82.94,32.31l62.69-62.36C390.86,72.72,340.34,32,261.6,32h0c-60.75,0-119,23.27-161.58,65.71C58,139.5,36.25,199.93,36.25,256S56.83,369.48,97.55,411.6C141.06,456.52,202.68,480,266.13,480c57.73,0,112.45-22.62,151.45-63.66,38.34-40.4,58.17-96.3,58.17-154.9C475.75,236.77,473.27,222.12,473.16,221.48Z"
								></path></g
							></svg
						>
						Sign Up with Email
					</button>
				</div>
				<div class="flex">
					<button
						onclick={signInEmail}
						class="inline-flex w-full items-center justify-center rounded-md bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none"
					>
						<svg
							class="mr-2"
							fill="#ffffff"
							width="24px"
							height="24px"
							viewBox="0 0 512 512"
							xmlns="http://www.w3.org/2000/svg"
							stroke="#ffffff"
							><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
								id="SVGRepo_tracerCarrier"
								stroke-linecap="round"
								stroke-linejoin="round"
							></g><g id="SVGRepo_iconCarrier"
								><title>ionicons-v5_logos</title><path
									d="M473.16,221.48l-2.26-9.59H262.46v88.22H387c-12.93,61.4-72.93,93.72-121.94,93.72-35.66,0-73.25-15-98.13-39.11a140.08,140.08,0,0,1-41.8-98.88c0-37.16,16.7-74.33,41-98.78s61-38.13,97.49-38.13c41.79,0,71.74,22.19,82.94,32.31l62.69-62.36C390.86,72.72,340.34,32,261.6,32h0c-60.75,0-119,23.27-161.58,65.71C58,139.5,36.25,199.93,36.25,256S56.83,369.48,97.55,411.6C141.06,456.52,202.68,480,266.13,480c57.73,0,112.45-22.62,151.45-63.66,38.34-40.4,58.17-96.3,58.17-154.9C475.75,236.77,473.27,222.12,473.16,221.48Z"
								></path></g
							></svg
						>
						Sign In with Email
					</button>
				</div>
			</div>

			<!-- <div class="flex flex-col gap-3 text-center">
				<p class="mb-6 text-gray-600">or</p>
				<h2 class="text-2xl font-semibold text-gray-800">E-mail</h2>
				<form
					method="POST"
					action="?/registerUserZodSchema"
					use:registerUserEnhance
					class="mx-auto w-full max-w-sm text-black"
				>
					<div class="mb-5">
						<label for="name" class="mb-2 block text-sm font-medium text-gray-900 dark:text-black"
							>Username</label
						>
						<input
							type="name"
							id="name"
							bind:value={$registerUserForm.name}
							autocomplete="one-time-code"
							class="peer w-full rounded-md border border-gray-300 bg-white p-2 invalid:border-red-500 invalid:ring-red-300 focus:border-blue-500 focus:ring focus:ring-blue-300"
							placeholder="Joshuamood"
							required
						/>
						{#if $registerUserErrors.name}<p class="hidden text-sm text-red-600 peer-invalid:block">
								{$registerUserErrors.name}
							</p>{/if}
					</div>
					<div class="mb-5">
						<label for="email" class="mb-2 block text-sm font-medium text-gray-900 dark:text-black"
							>Your email</label
						>
						<input
							type="email"
							id="email"
							bind:value={$registerUserForm.email}
							autocomplete="one-time-code"
							class="peer w-full rounded-md border border-gray-300 bg-white p-2 invalid:border-red-500 invalid:ring-red-300 focus:border-blue-500 focus:ring focus:ring-blue-300"
							placeholder="joshua@mood.com"
							required
						/>
						{#if $registerUserErrors.email}<p
								class="hidden text-sm text-red-600 peer-invalid:block"
							>
								{$registerUserErrors.email}
							</p>{/if}
					</div>
					<div class="mb-5">
						<label
							for="password"
							class="mb-2 block text-sm font-medium text-gray-900 dark:text-black"
							>Your password</label
						>
						<input
							type="password"
							id="password"
							placeholder="password..."
							bind:value={$registerUserForm.password}
							autocomplete="one-time-code"
							class="peer w-full rounded-md border border-gray-300 bg-white p-2 invalid:border-red-500 invalid:ring-red-300 focus:border-blue-500 focus:ring focus:ring-blue-300"
							required
						/>
						{#if $registerUserErrors.password}<p
								class="hidden text-sm text-red-600 peer-invalid:block"
							>
								{$registerUserErrors.password}
							</p>{/if}
					</div>
					<button onclick={signUpEmail} type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Submit</button>
				</form>
			</div> -->
		{/if}
	</div>
</div>
