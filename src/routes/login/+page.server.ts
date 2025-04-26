import { auth } from '$lib/auth';
import { RegisterUserZodSchema } from '$lib/validations/AuthZodSchemas';
import type { Actions } from '@sveltejs/kit';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async ({ request }) => {
	const form = await superValidate(zod(RegisterUserZodSchema));

	const session = await auth.api.getSession({
		headers: request.headers
	});

	return {
		session,
		form
	};
};

export const actions: Actions = {
	registerUserZodSchema: async ({ request }) => {
		const form = await superValidate(request, zod(RegisterUserZodSchema));

		console.warn(form.data);

		if (!form.valid) {
			// Return { form } and things will just work.
			return fail(400, { form });
		}

		// TODO: Do something with the validated form.data
		console.warn(form.data);
		// sendFooterForm(form.data.name, form.data.email, form.data.message);

		// Return the form with a status message
		return message(form, 'Form posted successfully!');
	}
};
