import { Hono } from 'hono';
import chatRoute from './chat.js';
const authRoute = new Hono();
authRoute.route('/chat', chatRoute);
export default authRoute;
