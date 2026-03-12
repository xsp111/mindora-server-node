import { Hono } from 'hono';
import { agentApiController } from '../controllers/index.js';

const chatRoute = new Hono();

chatRoute.post('/', agentApiController.chat);
chatRoute.post('/createChat', agentApiController.createConversation);
chatRoute.post('/get', agentApiController.get);
chatRoute.post('/list', agentApiController.getConversationList);
chatRoute.post('/delete', agentApiController.deleteConversation);
chatRoute.post('/newLabel', agentApiController.newLabel);

export default chatRoute;
