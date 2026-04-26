import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';
import type { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions.mjs';
import type { Model } from '../type.js';

const client = new OpenAI({
	apiKey: process.env.API_KEY,
	baseURL: process.env.API_BASE_URL,
});

async function send<T extends Partial<ChatCompletionCreateParamsBase>>(
	messages: ChatCompletionMessageParam[],
	options: T,
): Promise<
	T extends {
		stream: true;
	}
		? Model.StreamRes
		: Model.Res
>;
async function send(
	messages: ChatCompletionMessageParam[],
	options: Partial<ChatCompletionCreateParamsBase> & {},
) {
	const res = await client.chat.completions.create({
		model: process.env.MODEL || 'qwen3.5-flash',
		messages,
		...options,
	});
	return res;
}

export default {
	send,
};
