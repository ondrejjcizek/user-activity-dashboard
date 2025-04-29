import { auth } from '$lib/auth';
import { RegisterUserZodSchema, UserLoginZodSchema } from '$lib/validations/AuthZodSchemas';
import { type Actions, type ServerLoad } from '@sveltejs/kit';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

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
	registerForm: async (event) => {
		const form = await superValidate(event, zod(RegisterUserZodSchema));
		if (!form.valid) return fail(400, { form });

		try {
			// const { data, error } = await authClient.signUp.email({
			// 	email: form.data.email,
			// 	password: form.data.password,
			// 	name: `${form.data.firstName} ${form.data.lastName}`
			// });

			// if (error) {
			// 	console.error('Registration error:', error);
			// 	return fail(400, { form, message: { alertType: 'error', alertText: error.message } });
			// }

			return { form, message: { alertType: 'success', alertText: 'Registration successful!' } };
		} catch (err) {
			console.error('Registration exception:', err);
			return fail(500, { form, message: { alertType: 'error', alertText: 'Server error' } });
		}
	},

	loginForm: async (event) => {
		const form = await superValidate(event, zod(UserLoginZodSchema));
		if (!form.valid) return fail(400, { form });

		try {
			// const { data, error } = await authClient.signIn.email({
			// 	email: form.data.email,
			// 	password: form.data.password,
			// 	callbackURL: '/account'
			// });
			// if (error) {
			// 	console.error('Login error:', error);
			// 	return fail(400, { form, message: { alertType: 'error', alertText: error.message } });
			// }
			// throw redirect(303, '/account');
		} catch (err) {
			console.error('Login exception:', err);
			return fail(500, { form, message: { alertType: 'error', alertText: 'Server error' } });
		}
	}
};

// export const actions: Actions = {
// 	registerForm: async ({ request }) => {
// 		const form = await superValidate(request, zod(RegisterUserZodSchema));

// 		if (!form.valid) {
// 			return fail(400, { form });
// 		}

// 		try {
// 			await auth.api.signUpEmail({
// 				body: {
// 					email: form.data.email,
// 					password: form.data.password,
// 					name: `${form.data.firstName} ${form.data.lastName}`
// 				}
// 			});

// 			return message(form, {
// 				alertType: 'success',
// 				alertText: 'E-mail created. Please confirm in your email.'
// 			});
// 		} catch (err) {
// 			console.error('🔥 Signup error:', err);

// 			if (isAPIError(err) && err.body?.code === 'USER_ALREADY_EXISTS') {
// 				form.errors.email = ['This email is already registered. Try logging in instead.'];
// 				return fail(422, { form });
// 			}

// 			return message(form, {
// 				alertType: 'error',
// 				alertText: 'Something went wrong, please try again later.'
// 			});
// 		}
// 	},
// 	loginForm: async (event) => {
// 		const form = await superValidate(event, zod(UserLoginZodSchema));

// 		if (!form.valid) {
// 			return fail(400, { form });
// 		}

// 		try {
// 			await auth.api.signInEmail({
// 				body: {
// 					email: form.data.email,
// 					password: form.data.password
// 				}
// 			});

// 			throw redirect(303, '/account'); // nebo kamkoliv chceš po loginu
// 		} catch (err) {
// 			console.error('🔥 Login error:', err);

// 			if (isAPIError(err)) {
// 				if (err.body?.code === 'EMAIL_NOT_VERIFIED') {
// 					return message(form, {
// 						alertType: 'error',
// 						alertText: 'Please verify your email address before logging in.'
// 					});
// 				}
// 			}

// 			// throw redirect(303, '/account'); // nebo kamkoliv chceš po loginu
// 			return message(form, {
// 				alertType: 'error',
// 				alertText: 'Invalid email or password.'
// 			});
// 		}
// 	}
// };
