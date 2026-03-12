import type { ApiResponse, User4ClientRes } from '../const/api.js';

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

export {
	base64UrlEncode,
	hmacSha256,
	getHashRefreshToken,
	getHashSignature,
	getApiRes,
};
