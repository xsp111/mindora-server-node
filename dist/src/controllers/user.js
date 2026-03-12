import msg from '../const/msg.js';
import { authService, userService } from '../services/index.js';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { getApiRes } from '../utils/index.js';
async function signup(c) {
    const { name, password } = await c.req.json();
    const res = await userService.createUser({ name, password });
    const apiRes = getApiRes();
    if (!res.success) {
        apiRes.msg = res.msg;
        return c.json(apiRes, 200);
    }
    if (!res.data) {
        apiRes.msg = msg.USER_CREATED_FAILED;
        return c.json(apiRes, 200);
    }
    const accessToken = await authService.getAccessToken({
        id: res.data.id,
    });
    const refreshToken = authService.getRefreshToken();
    const refreshTokenRes = await authService.createRefreshToken({
        userId: res.data.id,
        refreshToken: refreshToken,
    });
    if (!refreshTokenRes.success) {
        apiRes.msg = refreshTokenRes.msg;
        return c.json(apiRes, 200);
    }
    setCookie(c, 'refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 30,
    });
    apiRes.success = true;
    apiRes.msg = msg.LOGIN_SUCCESS;
    apiRes.data = {
        name: res.data.name || '',
        avatar: '/default-avatar.svg',
        accessToken: accessToken,
    };
    return c.json(apiRes, 200);
}
async function login(c) {
    const apiRes = getApiRes();
    const refreshToken = getCookie(c, 'refreshToken');
    const { name, password, remember } = await c.req.json();
    if (!refreshToken && !name && !password) {
        apiRes.msg = msg.NOT_LOGIN;
        return c.json(apiRes, 200);
    }
    if (refreshToken) {
        const verifyRes = await authService.verifyRefreshToken(refreshToken);
        if (!verifyRes.success) {
            apiRes.msg = verifyRes.msg;
            // 多点登录会导致刷新令牌无效
            if (verifyRes.msg === msg.REFRESH_TOKEN_INVALID) {
                deleteCookie(c, 'refreshToken');
            }
            return c.json(apiRes, 200);
        }
        if (!verifyRes.data) {
            apiRes.msg = msg.REFRESH_TOKEN_INVALID;
            return c.json(apiRes, 200);
        }
        const searchRes = await userService.getUser({
            id: verifyRes.data,
        });
        if (!searchRes.success) {
            apiRes.msg = searchRes.msg;
            return c.json(apiRes, 200);
        }
        if (!searchRes.data) {
            apiRes.msg = msg.USER_NOT_FOUND;
            return c.json(apiRes, 200);
        }
        const accessToken = await authService.getAccessToken({
            id: searchRes.data.id,
        });
        apiRes.success = verifyRes.success;
        apiRes.msg = verifyRes.msg;
        apiRes.data = {
            name: searchRes.data.name || '',
            avatar: searchRes.data?.avatar || '/default-avatar.svg',
            accessToken: accessToken,
        };
        return c.json(apiRes, 200);
    }
    const res = await userService.getUser({ name });
    if (!res.success) {
        apiRes.msg = res.msg;
        return c.json(apiRes, 200);
    }
    if (!res.data) {
        apiRes.msg = msg.USER_NOT_FOUND;
        return c.json(apiRes, 200);
    }
    if (res.data?.password !== password) {
        apiRes.msg = msg.LOGIN_FAILED_NAME_OR_PASSWORD;
        return c.json(apiRes, 200);
    }
    const accessToken = await authService.getAccessToken({
        id: res.data.id,
    });
    let NewRefreshToken = '';
    if (remember) {
        NewRefreshToken = authService.getRefreshToken();
        const refreshTokenRes = await authService.createRefreshToken({
            userId: res.data.id,
            refreshToken: NewRefreshToken,
        });
        if (!refreshTokenRes.success) {
            apiRes.msg = refreshTokenRes.msg;
            return c.json(apiRes, 200);
        }
        setCookie(c, 'refreshToken', NewRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 60 * 60 * 24 * 30,
        });
    }
    apiRes.success = true;
    apiRes.msg = msg.LOGIN_SUCCESS;
    apiRes.data = {
        name: res.data.name,
        avatar: res.data?.avatar || '/default-avatar.svg',
        accessToken: accessToken,
    };
    return c.json(apiRes, 200);
}
async function logout(c) {
    const apiRes = getApiRes();
    const refreshToken = getCookie(c, 'refreshToken');
    if (refreshToken) {
        const deleteRes = await authService.deleteRefreshToken(refreshToken);
        if (!deleteRes.success) {
            apiRes.msg = deleteRes.msg;
            return c.json(apiRes, 200);
        }
        deleteCookie(c, 'refreshToken');
    }
    apiRes.success = true;
    apiRes.msg = msg.LOGOUT_SUCCESS;
    return c.json(apiRes, 200);
}
export { signup, login, logout };
