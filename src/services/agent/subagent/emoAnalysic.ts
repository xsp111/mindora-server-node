import type { ChatCompletionMessageParam } from 'openai/resources';
import model from '../module/model.js';
import getSysPrompt from '../prompt/index.js';
import query from '../rag/index.js';
import type { Memory } from '../type.js';

export default async function emoAnalysic(ctx: Memory.Ctx) {
	const input = ctx.userInput.content as string;
	const res = await Promise.all([
		query(input),
		analyzeEmotion(
			ctx.originalContent
				.filter((item) => item.role === 'user')
				.map((item) => item.content)
				.slice(-3)
				.join('\n'),
		),
	]);

	const analysis = {
		role: 'assistant',
		content: `<context>${res[0]}</context><analysis>${res[1]}</analysis>\n以上为分析上下文以及当前用户情感状态，用户原始问题：${ctx.userInput.content}`,
		useOnce: true,
	} as ChatCompletionMessageParam;

	ctx.lastMessages.push(analysis);
}

async function analyzeEmotion(input: string) {
	const sysPrompt = getSysPrompt('emoAnalysic');

	// 调用模型量化情感
	const res = await model.send(
		[sysPrompt, { role: 'user', content: input }],
		{
			enable_thinking: false,
			response_format: {
				type: 'json_object',
			},
		},
	);

	const jsonString = res.choices[0].message.content;

	return `情感分析结果：${jsonString}`;
}
