import { z } from 'zod';

const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 50;
export const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 2;
export const MAX_PASSWORD_LENGTH = 128;
export const EMAIL_VERIFICATION_CODE_LENGTH = 8;
export const MIN_TODO_TITLE_LENGTH = 1;
export const MIN_TODO_DESC_LENGTH = 1;

const NAME_MIN_ERROR_MESSAGE = `Name must be at least ${MIN_NAME_LENGTH} characters long`;
const NAME_MAX_ERROR_MESSAGE = `Name must be less than ${MAX_NAME_LENGTH} characters long`;
const EMAIL_MAX_ERROR_MESSAGE = `Email must be less than ${MAX_EMAIL_LENGTH} characters long`;
const PASSWORD_MIN_ERROR_MESSAGE = `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
const PASSWORD_MAX_ERROR_MESSAGE = `Password must be less than ${MAX_PASSWORD_LENGTH} characters long`;

const PASSWORD_SPECIAL_CHARS = '@$!%*?&';
const PASSWORD_SPECIAL_CHARS_MESSAGE = ` Requires a special character: (${PASSWORD_SPECIAL_CHARS.split('').join(', ')})`;

const advancedPasswordSchema = z
	.string()
	.min(MIN_PASSWORD_LENGTH, PASSWORD_MIN_ERROR_MESSAGE)
	.max(MAX_PASSWORD_LENGTH, PASSWORD_MAX_ERROR_MESSAGE)
	.refine((password) => /[a-z]/.test(password), { message: ' Requires a lowercase letter' })
	.refine((password) => /[A-Z]/.test(password), { message: ' Requires an uppercase letter' })
	.refine((password) => /\d/.test(password), { message: ' Requires a number' })
	.refine((password) => new RegExp(`[${PASSWORD_SPECIAL_CHARS}]`).test(password), {
		message: PASSWORD_SPECIAL_CHARS_MESSAGE
	});

export const emailZodSchema = z.string().email().max(MAX_EMAIL_LENGTH, EMAIL_MAX_ERROR_MESSAGE);

export const RegisterUserZodSchema = z.object({
	firstName: z
		.string()
		.min(MIN_NAME_LENGTH, NAME_MIN_ERROR_MESSAGE)
		.max(MAX_NAME_LENGTH, NAME_MAX_ERROR_MESSAGE),
	lastName: z
		.string()
		.min(MIN_NAME_LENGTH, NAME_MIN_ERROR_MESSAGE)
		.max(MAX_NAME_LENGTH, NAME_MAX_ERROR_MESSAGE),
	email: emailZodSchema
});

export const UserLoginZodSchema = z.object({
	email: emailZodSchema,
	password: z
		.string()
		.min(MIN_PASSWORD_LENGTH, PASSWORD_MIN_ERROR_MESSAGE)
		.max(MAX_PASSWORD_LENGTH, PASSWORD_MAX_ERROR_MESSAGE)
});

export const EmailVerificationCodeZodSchema = z.object({
	verificationCode: z.string().length(EMAIL_VERIFICATION_CODE_LENGTH)
});

export const passwordResetEmailZodSchema = UserLoginZodSchema.pick({ email: true });

export const PasswordResetZodSchema = z
	.object({
		newPassword: advancedPasswordSchema,
		confirmPassword: advancedPasswordSchema,
		passwordResetToken: z.string().optional()
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: " Passwords don't match",
		path: ['confirmPassword']
	});
