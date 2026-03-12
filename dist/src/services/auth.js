import jwt from 'jsonwebtoken';
import msg from '../const/msg.js';
import db from '../db/index.js';
import { getHashRefreshToken } from '../utils/index.js';
async function getAccessToken(payload) {
    const finalPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
    };
    const accessToken = jwt.sign(finalPayload, process.env.JWT_SECRET || '', {
        expiresIn: '1h',
    });
    return accessToken;
}
function getRefreshToken() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Buffer.from(bytes)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
async function createRefreshToken({ userId, refreshToken, }) {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    try {
        const hashToken = await getHashRefreshToken(refreshToken, process.env.SERVER_SECRET || '');
        const existingToken = await db.refreshToken.findFirst({
            where: {
                userId,
            },
        });
        if (existingToken) {
            await db.refreshToken.update({
                where: {
                    id: existingToken.id,
                },
                data: {
                    token: hashToken,
                    expiresAt,
                },
            });
        }
        else {
            await db.refreshToken.create({
                data: {
                    userId,
                    token: hashToken,
                    expiresAt,
                },
            });
        }
        return {
            success: true,
            msg: '',
        };
    }
    catch (error) {
        return {
            success: false,
            msg: msg.SERVER_ERROR,
        };
    }
}
async function deleteRefreshToken(refreshToken) {
    try {
        const hashToken = await getHashRefreshToken(refreshToken, process.env.SERVER_SECRET || '');
        await db.refreshToken.delete({
            where: {
                token: hashToken,
            },
        });
        return {
            success: true,
            msg: '',
        };
    }
    catch (error) {
        return {
            success: false,
            msg: msg.SERVER_ERROR,
        };
    }
}
async function verifyRefreshToken(refreshToken) {
    try {
        const hashToken = await getHashRefreshToken(refreshToken, process.env.SERVER_SECRET || '');
        const existingToken = await db.refreshToken.findFirst({
            where: {
                token: hashToken,
            },
        });
        if (!existingToken || existingToken.expiresAt < new Date()) {
            return {
                success: false,
                msg: msg.REFRESH_TOKEN_INVALID,
            };
        }
        return {
            success: true,
            msg: '',
            data: existingToken.userId,
        };
    }
    catch (error) {
        return {
            success: false,
            msg: msg.SERVER_ERROR,
        };
    }
}
async function verifyAccessToken(accessToken) {
    try {
        const payload = jwt.verify(accessToken, process.env.JWT_SECRET || '');
        console.log(payload);
        return {
            success: true,
            msg: '',
            data: { id: payload.id },
        };
    }
    catch (error) {
        return {
            success: false,
            msg: msg.ACCESS_TOKEN_INVALID,
        };
    }
}
export { getAccessToken, getRefreshToken, createRefreshToken, deleteRefreshToken, verifyRefreshToken, verifyAccessToken, };
