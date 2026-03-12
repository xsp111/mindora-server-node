import { ChatDeepSeek } from '@langchain/deepseek';
const coreLLM = new ChatDeepSeek({
    apiKey: process.env.API_KEY,
    model: 'deepseek-chat',
    temperature: 0.1,
});
export default coreLLM;
