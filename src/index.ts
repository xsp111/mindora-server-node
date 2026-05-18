import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import apiRoute from './routes/index.js';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';
import { serveStatic } from '@hono/node-server/serve-static';
import { authAccessTokenJWT } from './middleware/index.js';

const app = new Hono();

// middleware
app.use(logger());
app.use(
	'/api/*',
	cors({
		origin: ['http://localhost:5173', 'https://mindora.xsp111.cn'],
		credentials: true,
	}),
);

app.use('*/auth/*', authAccessTokenJWT);

app.route('/api', apiRoute);

app.use(
	'/static/*',
	serveStatic({
		root: './',
	}),
);

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
