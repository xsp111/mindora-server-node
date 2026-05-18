import { Hono } from 'hono';
import chatRoute from './chat.js';
import { userController } from '@/controllers/index.js';

const authRoute = new Hono();

authRoute.route('/chat', chatRoute);
authRoute.post('/user/edit', userController.editUserInfo);

export default authRoute;
