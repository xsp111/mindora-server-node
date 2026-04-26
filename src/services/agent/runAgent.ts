import { memory } from './memory/index.js';
import client from './module/model.js';
import type { Client, Tool, Model } from './type.js';
import useTools from './tool/index.js';
import emoAnalysic from './subagent/emoAnalysic.js';
import { runCharacteristicAgent } from './subagent/index.js';

export default async function run(input: Client.input) {
	const ctx = await memory.getContext(input);

	await emoAnalysic(ctx);

	let finalOutput = '';
	while (true) {
		await memory.ctxAnalyse(ctx);
		const res = (await client.send([...ctx.lastMessages], {
			tools: ctx.tools,
			stream: true,
			enable_thinking: false,
			stream_options: {
				include_usage: true,
			},
		})) as Model.StreamRes;
		let output = '';
		let toolCalls = [];
		for await (const chunk of res) {
			if (chunk.usage) {
				ctx.lastTokenCost = chunk.usage.prompt_tokens;
			}
			const delta = chunk.choices[0]?.delta;
			if (!delta) {
				continue;
			}
			output += delta.content;
			ctx.cnn?.send(delta.content || '');

			const deltaToolCalls = delta.tool_calls;

			// 拼接 toolCalls
			if (deltaToolCalls) {
				for (const toolCallChunk of deltaToolCalls) {
					const index = toolCallChunk.index;
					toolCallChunk.function!.arguments =
						toolCallChunk?.function?.arguments || '';
					if (!toolCalls[index]) {
						toolCalls[index] = { ...toolCallChunk };
						if (!toolCalls[index].function) {
							toolCalls[index].function = {
								name: '',
								arguments: '',
							};
						}
					} else if (toolCallChunk.function?.arguments) {
						toolCalls[index].function!.arguments +=
							toolCallChunk.function.arguments;
					}
				}
			}
		}

		// 如有 toolCalls，执行 toolCalls
		if (toolCalls.length > 0) {
			await useTools(ctx, toolCalls as Tool.ToolCalls);
		} else {
			finalOutput += output;
			break;
		}
	}

	await memory.setContext(ctx, finalOutput);
	console.log(ctx.originalContent.length);
	if (ctx.originalContent.length % 4 === 0) {
		// 每两轮对话，异步更新 characteristic
		runCharacteristicAgent(ctx.userId, {
			time: Date.now().toString(),
			messages: ctx.originalContent.slice(-4),
		});
	}
	return finalOutput;
}
