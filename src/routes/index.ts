import { Hono } from 'hono';
import userRoute from './user.js';
import authRoute from './auth.js';

const apiRoute = new Hono();

apiRoute.route('/user', userRoute);
apiRoute.route('/auth', authRoute);

export default apiRoute;
