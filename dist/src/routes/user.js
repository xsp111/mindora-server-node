import { Hono } from 'hono';
import { userController } from '../controllers/index.js';
const userRoute = new Hono();
userRoute.post('/signup', userController.signup);
userRoute.post('/login', userController.login);
userRoute.post('/logout', userController.logout);
export default userRoute;
