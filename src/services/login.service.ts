import type { Prisma, User } from '@prisma/client';
import db from '../db/index.js';
import msg from '../const/msg.js';
import { getHashRefreshToken, storeAvatar } from '../utils/index.js';
import {
	getAccessToken,
	getRefreshToken,
	rememberLogin,
	verifyRefreshToken,
} from './auth.service.js';
import { mail2Token } from './mail.service.js';
import type { EditUserInfo } from '@/const/api.js';
import type { Memory } from './agent/type.js';

async function defaultLogin(
	loginInput: Prisma.UserWhereInput,
	remember: boolean = false,
	givenRefreshToken?: string,
): Promise<{
	user: User;
	accessToken: string;
	refreshToken: string;
}> {
	const { password, ...loginInputWithoutPassword } = loginInput;
	const user = await db.user.findFirst({
		where: loginInputWithoutPassword,
	});
	if (!user) {
		throw new Error(msg.USER_NOT_FOUND);
	}
	if (password && user.password !== password) {
		throw new Error(msg.LOGIN_FAILED_NAME_OR_PASSWORD);
	}
	const accessToken = await getAccessToken({
		id: user.id,
	});
	const refreshToken = givenRefreshToken || getRefreshToken();
	if (remember) {
		await rememberLogin({
			userId: user.id,
			refreshToken,
		});
	}
	return {
		user,
		accessToken,
		refreshToken,
	};
}

async function autoLoginVerify({
	refreshToken,
}: {
	refreshToken: string;
}): Promise<{
	user: User;
	accessToken: string;
}> {
	const { userId } = await verifyRefreshToken({ refreshToken });
	const user = await db.user.findUnique({
		where: {
			id: userId,
		},
	});
	if (!user) {
		throw new Error(msg.USER_NOT_FOUND);
	}
	const accessToken = await getAccessToken({
		id: userId,
	});
	return {
		user,
		accessToken,
	};
}

async function emailLogin({ verifyToken }: { verifyToken: string }) {
	const client = mail2Token.get(verifyToken);
	if (!client) {
		throw new Error(msg.VERIFY_EMAIL_FAILED);
	}
	try {
		const email = client.sendTo;
		let loginRes: {
			user: User;
			accessToken: string;
			refreshToken: string;
		} | null = null;
		try {
			loginRes = await defaultLogin(
				{
					email,
				},
				true,
				client.refreshToken,
			);
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === msg.USER_NOT_FOUND
			) {
				loginRes = await signUp(
					{
						email,
						name: email.split('@')[0],
					},
					client.refreshToken,
				);
			} else {
				throw error;
			}
		}
		const userInfo = {
			id: loginRes.user.id,
			name: loginRes.user.name || '',
			avatar: loginRes.user?.avatar || '/default-avatar.svg',
			accessToken: loginRes.accessToken,
		};
		if (client.state === 'waiting' && client.verifySuccessCallback) {
			await client.verifySuccessCallback(userInfo);
			mail2Token.delete(verifyToken);
		} else {
			client.state = 'verified';
			client.user = userInfo;
		}
	} catch (error) {
		// 如果邮件登录过程中失败，则在这层处理 sse 失败回调
		console.error(client);
		if (client.state === 'waiting' && client.verifyFailCallback) {
			console.log('fail callback');
			await client.verifyFailCallback(msg.EMAIL_LOGIN_FAILED);
			mail2Token.delete(verifyToken);
		} else {
			client.state = 'failed';
		}
		throw error;
	}
}

async function signUp(
	signUpInfo: Prisma.UserCreateInput,
	givenRefreshToken?: string,
): Promise<{
	user: User;
	accessToken: string;
	refreshToken: string;
}> {
	const defaultSettings: Memory.UserSettings = {
		reply: {
			style: 0,
			gentle: 0,
			passion: 0,
			titleAndList: 0,
			emoji: 0,
			custom: '',
		},
		privacy: {
			nickname: signUpInfo.name || '',
			career: '',
			detail: '',
			useMemory: true,
			reset: 0,
		},
	};
	const user = await db.user.create({
		data: {
			...signUpInfo,
			settings: defaultSettings,
		},
	});
	await db.characteristic.create({
		data: {
			userId: user.id,
			profileSummary: '',
			overview: '',
			emotionTrend7d: [],
			dimensions: {
				valence: -1,
				arousal: -1,
				stress: -1,
				cognitive_distortion: -1,
				regulation: -1,
				risk: -1,
			},
			suggestions: [],
			insights: {
				summary: '',
				keywords: [],
			},
		},
	});
	const accessToken = await getAccessToken({
		id: user.id,
	});
	const refreshToken = givenRefreshToken || getRefreshToken();
	await rememberLogin({
		userId: user.id,
		refreshToken,
	});
	return {
		user,
		accessToken,
		refreshToken,
	};
}

async function logout({ refreshToken }: { refreshToken: string | undefined }) {
	if (!refreshToken) {
		throw new Error(msg.REFRESH_TOKEN_INVALID);
	}
	const hashToken = await getHashRefreshToken(
		refreshToken,
		process.env.SERVER_SECRET || '',
	);
	await db.refreshToken.delete({
		where: {
			token: hashToken,
		},
	});
}

async function editUserInfo(
	userId: string,
	{ name, email, avatar }: EditUserInfo,
) {
	let avatarUrl = undefined;
	if (avatar instanceof File) {
		avatarUrl = await storeAvatar(userId, avatar);
	}

	const updateData: Prisma.UserUpdateInput = {};
	if (avatarUrl) {
		updateData.avatar = avatarUrl;
	}
	if (name) {
		updateData.name = name;
	}
	if (email) {
		updateData.email = email;
	}

	const user = await db.user.update({
		where: {
			id: userId,
		},
		data: updateData,
	});

	return user;
}

export {
	defaultLogin,
	autoLoginVerify,
	emailLogin,
	signUp,
	logout,
	editUserInfo,
};
