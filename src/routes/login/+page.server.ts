import { auth } from '$lib/auth';
import { RegisterUserZodSchema, UserLoginZodSchema } from '$lib/validations/AuthZodSchemas';
import { redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
// import { authClient } from '$lib/auth-client';
import { isAPIError } from '$lib/utils';

export const load: ServerLoad = async ({ request }) => {
	const registerForm = await superValidate(zod(RegisterUserZodSchema));
	const loginForm = await superValidate(zod(UserLoginZodSchema));

	const session = await auth.api.getSession({
		headers: request.headers
	});

	return {
		session,
		loginForm,
		registerForm
	};
};

export const actions: Actions = {
	registerForm: async ({ request }) => {
		const form = await superValidate(request, zod(RegisterUserZodSchema));

		console.log('Register form data:', form.data);

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await auth.api.signUpEmail({
				body: {
					email: form.data.email,
					password: form.data.password,
					name: `${form.data.firstName} ${form.data.lastName}`
				}
			});

			return message(form, {
				alertType: 'success',
				alertText: 'E-mail created. Please confirm in your email.'
			});
		} catch (err) {
			console.error('🔥 Signup error:', err);

			if (isAPIError(err) && err.body?.code === 'USER_ALREADY_EXISTS') {
				form.errors.email = ['This email is already registered. Try logging in instead.'];
				return fail(422, { form });
			}

			return message(form, {
				alertType: 'error',
				alertText: 'Something went wrong, please try again later.'
			});
		}
	},
	loginForm: async (event) => {
		const form = await superValidate(event, zod(UserLoginZodSchema));
		if (!form.valid) return fail(400, { form });

		const res = await event.fetch('/api/sign-in', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email: form.data.email,
				password: form.data.password
			})
		});

		if (!res.ok) {
			console.error('❌ Login failed', await res.text());
			return fail(res.status, {
				form,
				message: {
					alertType: 'error',
					alertText: 'Login failed. Server returned ' + res.status
				}
			});
		}

		throw redirect(303, '/account');
	}
};
