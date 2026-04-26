import type { Message } from '@/const/api.js';
import { readFileSync } from 'fs';
import type { ChatCompletionSystemMessageParam } from 'openai/resources';

type promptType = 'emoAnalysic' | 'summary' | 'characteristic' | 'mindora';
const promptMap = new Map<promptType, Message>();
export const PROMPT_PATH = './src/services/agent/prompt/';

export default function getSysPrompt(type: promptType = 'mindora') {
	return (promptMap.get(type) ||
		promptMap
			.set(type, {
				role: 'system',
				content: getContent(type + '.md'),
			})
			.get(type)) as ChatCompletionSystemMessageParam;
}

function getContent(fileName: string) {
	return readFileSync(PROMPT_PATH + fileName, 'utf-8');
}
