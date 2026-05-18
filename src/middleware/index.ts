import msg from '@/const/msg.js';
import { createMiddleware } from 'hono/factory';
import jwt, { type JwtPayload } from 'jsonwebtoken';

const authAccessTokenJWT = createMiddleware(async (c, next) => {
	const secret = process.env.JWT_SECRET || '';
	const accessToken = c.req.header('Authorization')?.split(' ')[1];
	if (!accessToken) {
		return c.json({ msg: msg.ACCESS_UNAUTHORIZED }, 401);
	}
	const payload = jwt.verify(accessToken, secret) as JwtPayload;
	c.set('userId', payload.id);
	await next();
});

export { authAccessTokenJWT };
