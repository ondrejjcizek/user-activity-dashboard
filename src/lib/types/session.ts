export type MySession = {
	id: string;
	userId: string;
	token: string;
	createdAt: Date;
	updatedAt: Date;
	expiresAt: Date;
	ipAddress?: string;
	userAgent?: string;
	role?: string;
};
