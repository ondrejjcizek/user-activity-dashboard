/* eslint-disable */
/**
 * This file was generated manually.
 */

/**
 * PAGES
 */
const PAGES = {
	'/': `/`,
	'/account': `/account`,
	'/account/activate/[token]': `/account/activate/[token]`,
	'/login': `/login`
};

/**
 * API SERVERS
 */
const SERVERS = {
	'GET /api/activity/[id]': `/api/activity/[id]`,
	'POST /api/users/[id]': `/api/users/[id]`
	// and so on...
};

/**
 * API ACTIONS
 */
const ACTIONS = {
	'signUp /login': `/login?/signUp`,
	'signIn /login': `/login?/signIn`,
	'verifyEmail /account/activate/[token]': `/account/activate/[token]?/verifyEmail`
	// etc.
};

const appendSp = (sp?: Record<string, string | number | undefined>, prefix: '?' | '&' = '?') => {
	if (!sp) return '';
	const mapping = Object.entries(sp)
		.filter(([, v]) => v !== undefined)
		.map(([k, v]) => [k, String(v)]);
	const formated = new URLSearchParams(mapping).toString();
	return formated ? `${prefix}${formated}` : '';
};

export const currentSp = () => {
	const params = new URLSearchParams(window.location.search);
	const record: Record<string, string> = {};
	for (const [key, value] of params.entries()) {
		record[key] = value;
	}
	return record;
};

type NonFunctionKeys<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
type FunctionKeys<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
type FunctionParams<T> = T extends (...args: infer P) => any ? P : never;

const AllObjs = { ...PAGES, ...ACTIONS, ...SERVERS, ...LINKS };
type AllTypes = typeof AllObjs;

export function route<T extends FunctionKeys<AllTypes>>(
	key: T,
	...params: FunctionParams<AllTypes[T]>
): string;
export function route<T extends NonFunctionKeys<AllTypes>>(key: T): string;
export function route<T extends keyof AllTypes>(key: T, ...params: any[]): string {
	if (typeof AllObjs[key] === 'function') {
		const element = AllObjs[key] as (...args: any[]) => string;
		return element(...params);
	} else {
		return AllObjs[key] as string;
	}
}

export type KIT_ROUTES = {
	PAGES: typeof PAGES;
	SERVERS: typeof SERVERS;
	ACTIONS: typeof ACTIONS;
	LINKS: typeof LINKS;
	Params: Record<string, never>;
};
