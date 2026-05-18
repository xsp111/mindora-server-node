import { Hono } from 'hono';
import { agentApiController } from '../controllers/index.js';

const chatRoute = new Hono();

chatRoute.post('/', agentApiController.chat);
chatRoute.post('/createChat', agentApiController.createConversation);
chatRoute.post('/get', agentApiController.get);
chatRoute.post('/list', agentApiController.getConversationList);
chatRoute.post('/delete', agentApiController.deleteConversation);
chatRoute.post('/newLabel', agentApiController.newLabel);
chatRoute.get('/profile', agentApiController.getCharacteristic);
chatRoute.get('/settings', agentApiController.getSettings);
chatRoute.post('/update-settings', agentApiController.updateSettings);

export default chatRoute;
