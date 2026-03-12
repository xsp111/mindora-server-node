import { Hono } from 'hono';
import { userController } from '../controllers/index.js';

const userRoute = new Hono();

userRoute.post('/signup', userController.signup);
userRoute.post('/login', userController.login);
userRoute.post('/logout', userController.logout);
userRoute.post('/login/email', userController.sendVerifyEmail);
userRoute.get('/login/email/verify', userController.wait4ClientVerify);
userRoute.post('/login/email/verify', userController.emailLogin);

export default userRoute;
