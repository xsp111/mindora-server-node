import path from 'node:path';
import type { ApiResponse, User4ClientRes } from '../const/api.js';
import { mkdir, rm, writeFile } from 'node:fs/promises';

function base64UrlEncode(input: Uint8Array | string): string {
	const bytes =
		typeof input === 'string' ? new TextEncoder().encode(input) : input;

	return Buffer.from(bytes)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

async function hmacSha256(key: string, data: string): Promise<Uint8Array> {
	const signature = await getHashSignature(key, data);
	return new Uint8Array(signature);
}

async function getHashSignature(
	secret: string,
	data: string,
): Promise<ArrayBuffer> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);

	const signature = await crypto.subtle.sign(
		'HMAC',
		key,
		new TextEncoder().encode(data),
	);

	return signature;
}

async function getHashRefreshToken(
	refreshToken: string,
	serverSecret: string,
): Promise<string> {
	const signature = await getHashSignature(serverSecret, refreshToken);
	return Buffer.from(signature).toString('hex');
}

function getApiRes<T>(): ApiResponse<T> {
	return {
		success: false,
		msg: '',
		data: {} as T,
	};
}

async function storeAvatar(userId: string, avatar: File) {
	const arrayBuffer = await avatar.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	let fileDir = path.join(process.cwd(), 'avatars', userId);

	if (process.env.ENV === 'dev') {
		fileDir = path.join(process.cwd(), '../web/public/avatars', userId);
	} else {
		fileDir = path.join(process.cwd(), '/static/avatars', userId);
	}
	// TODO: 删除旧的头像
	await rm(fileDir, { recursive: true, force: true });

	const fileName = `${Date.now()}-${crypto.randomUUID() + path.extname(avatar.name)}`;
	await mkdir(fileDir, { recursive: true });
	await writeFile(path.join(fileDir, fileName), buffer);

	return `${path.join('/avatars', userId, fileName)}`;
}

export {
	base64UrlEncode,
	hmacSha256,
	getHashRefreshToken,
	getHashSignature,
	getApiRes,
	storeAvatar,
};
