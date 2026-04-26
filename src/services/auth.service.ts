import jwt from 'jsonwebtoken';
import msg from '../const/msg.js';
import db from '../db/index.js';
import { getHashRefreshToken } from '../utils/index.js';
import type { dbOperationRes } from '../const/api.js';
async function getAccessToken(payload: { id: string }) {
	const finalPayload = {
		...payload,
		iat: Math.floor(Date.now() / 1000),
	};
	const accessToken = jwt.sign(finalPayload, process.env.JWT_SECRET || '', {
		expiresIn: '1h',
	});
	return accessToken;
}

function getRefreshToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));

	return Buffer.from(bytes)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

async function verifyAccessToken(
	accessToken: string,
): Promise<dbOperationRes<{ id: string }>> {
	try {
		const payload = jwt.verify(accessToken, process.env.JWT_SECRET || '');
		return {
			success: true,
			msg: '',
			data: { id: (payload as { id: string }).id },
		};
	} catch (error) {
		return {
			success: false,
			msg: msg.ACCESS_TOKEN_INVALID,
		};
	}
}

async function verifyRefreshToken({
	refreshToken,
}: {
	refreshToken: string;
}): Promise<{ userId: string }> {
	const hashToken = await getHashRefreshToken(
		refreshToken,
		process.env.SERVER_SECRET || '',
	);
	const existingToken = await db.refreshToken.findFirst({
		where: {
			token: hashToken,
		},
	});
	if (!existingToken) {
		throw new Error(msg.REFRESH_TOKEN_INVALID);
	}
	if (existingToken.expiresAt < new Date()) {
		db.refreshToken.delete({
			where: {
				token: hashToken,
			},
		});
		throw new Error(msg.REFRESH_TOKEN_EXPIRED);
	}
	return {
		userId: existingToken.userId,
	};
}

async function rememberLogin({
	userId,
	refreshToken,
}: {
	userId: string;
	refreshToken: string;
}) {
	const hashRefreshToken = await getHashRefreshToken(
		refreshToken,
		process.env.SERVER_SECRET || '',
	);
	await db.refreshToken.create({
		data: {
			token: hashRefreshToken,
			userId,
			expiresAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000),
		},
	});
}

export {
	getAccessToken,
	getRefreshToken,
	verifyRefreshToken,
	verifyAccessToken,
	rememberLogin,
};
