import type { Context } from 'hono';
import type { User4ClientRes } from '@/const/api.js';
import msg from '@/const/msg.js';
import { loginService, mailService } from '@services/index.js';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { getApiRes } from '@/utils/index.js';
import { streamSSE } from 'hono/streaming';

async function signup(c: Context) {
	const apiRes = getApiRes<User4ClientRes & { accessToken: string }>();
	const { name, password } = await c.req.json();
	try {
		const signUpRes = await loginService.signUp({
			name,
			password,
		});
		setCookie(c, 'refreshToken', signUpRes.refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'Strict',
			maxAge: 60 * 60 * 24 * 30,
		});
		apiRes.success = true;
		apiRes.msg = msg.LOGIN_SUCCESS;
		apiRes.data = {
			name: signUpRes.user.name || '',
			avatar: '/default-avatar.svg',
			accessToken: signUpRes.accessToken,
		};
		return c.json(apiRes, 200);
	} catch (error) {
		console.error(error);
		apiRes.msg = msg.SERVER_ERROR;
		return c.json(apiRes, 200);
	}
}

async function login(c: Context) {
	const apiRes = getApiRes<User4ClientRes & { accessToken: string }>();
	const refreshToken = getCookie(c, 'refreshToken');
	const { name, password, remember } = await c.req.json();
	if (!refreshToken && !name && !password) {
		apiRes.msg = msg.NOT_LOGIN;
		return c.json(apiRes, 200);
	}
	try {
		let serviceRes: any;
		if (refreshToken) {
			serviceRes = await loginService.autoLoginVerify({
				refreshToken,
			});
		} else {
			serviceRes = await loginService.defaultLogin(
				{
					name,
					password,
				},
				remember,
			);
			if (remember) {
				setCookie(c, 'refreshToken', serviceRes.refreshToken, {
					httpOnly: true,
					secure: true,
					sameSite: 'Strict',
					maxAge: 60 * 60 * 24 * 30,
				});
			}
		}
		apiRes.data = {
			name: serviceRes.user.name || '',
			avatar: serviceRes.user?.avatar || '/default-avatar.svg',
			email: serviceRes.user?.email || '',
			accessToken: serviceRes.accessToken,
		};
		apiRes.success = true;
		apiRes.msg = msg.LOGIN_SUCCESS;
		return c.json(apiRes, 200);
	} catch (error) {
		console.error(error);
		if (error instanceof Error) {
			apiRes.msg = error.message;
		} else {
			apiRes.msg = msg.SERVER_ERROR;
		}
		return c.json(apiRes, 200);
	}
}

async function logout(c: Context) {
	const apiRes = getApiRes();
	const refreshToken = getCookie(c, 'refreshToken');
	try {
		if (refreshToken) {
			await loginService.logout({
				refreshToken,
			});
		}
		deleteCookie(c, 'refreshToken');
		apiRes.success = true;
		apiRes.msg = msg.LOGOUT_SUCCESS;
		return c.json(apiRes, 200);
	} catch (error) {
		console.error(error);
		apiRes.msg = msg.SERVER_ERROR;
		return c.json(apiRes, 200);
	}
}

async function sendVerifyEmail(c: Context) {
	const apiRes = getApiRes<{ verifyToken: string }>();
	const { email } = await c.req.json();
	try {
		const { verifyToken, refreshToken } = await mailService.sendVerifyMail({
			sendTo: email,
		});
		apiRes.success = true;
		apiRes.msg = msg.VERIFY_EMAIL_SUCCESS;
		apiRes.data = {
			verifyToken: verifyToken,
		};
		setCookie(c, 'refreshToken', refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'Strict',
			maxAge: 60 * 60 * 24 * 30,
		});
		return c.json(apiRes, 200);
	} catch (error) {
		console.error(error);
		apiRes.msg = msg.SERVER_ERROR;
		return c.json(apiRes, 200);
	}
}

async function wait4ClientVerify(c: Context) {
	return streamSSE(c, async (stream) => {
		const verifyToken = c.req.query('verifyToken');
		let close: () => void;
		const wait = new Promise<void>((resolve) => {
			close = resolve;
		});
		try {
			await mailService.wait4ClientVerify({
				verifyToken,
				verifySuccessCallback: async (user) => {
					await stream.writeSSE({
						data: JSON.stringify(user),
						event: 'success',
					});
					close();
				},
				verifyFailCallback: async (error) => {
					await stream.writeSSE({
						data: JSON.stringify(error),
						event: 'error',
					});
					close();
				},
			});
		} catch (error) {
			console.error(error);
			await stream.writeSSE({
				data: msg.SERVER_ERROR,
				event: 'error',
			});
		}
		stream.onAbort(() => {
			stream.close();
			close();
		});
		await wait;
	});
}

async function emailLogin(c: Context) {
	const apiRes = getApiRes<User4ClientRes & { accessToken: string }>();
	const { verifyToken } = await c.req.json();
	try {
		await loginService.emailLogin({
			verifyToken,
		});
		apiRes.success = true;
		apiRes.msg = msg.LOGIN_SUCCESS;
		return c.json(apiRes, 200);
	} catch (error) {
		console.error(error);
		apiRes.msg = msg.PLEASE_TRY_AGAIN;
		return c.json(apiRes, 200);
	}
}

async function editUserInfo(c: Context) {
	const apiRes = getApiRes();
	const editInfo = await c.req.parseBody();
	const userId = c.get('userId');
	try {
		const user = await loginService.editUserInfo(userId, editInfo);
		apiRes.success = true;
		apiRes.data = {
			name: user.name,
			avatar: user.avatar,
			email: user.email,
		};
		return c.json(apiRes, 200);
	} catch (error) {
		console.error(error);
		apiRes.msg = msg.SERVER_ERROR;
		return c.json(apiRes, 200);
	}
}

export {
	signup,
	login,
	logout,
	editUserInfo,
	sendVerifyEmail,
	wait4ClientVerify,
	emailLogin,
};
