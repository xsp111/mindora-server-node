import type { ChatConversation, Message } from '@/const/api.js';
import type { Client, Memory } from '../type.js';
import {
	getCharacteristic,
	getCurrentConversation,
	updateConversation,
} from './api.js';
import type {
	ChatCompletionMessageParam,
	ChatCompletionUserMessageParam,
} from 'openai/resources';
import getSysPrompt from '../prompt/index.js';
import {
	MODAL_CONTEXT_LIMIT,
	tokenCompute,
	updateTokenPredictor,
} from './tokenizer.js';
import { runCharacteristicAgent, runSummaryAgent } from '../subagent/index.js';

async function getContext(userInput: Client.input): Promise<Memory.Ctx> {
	const { success, msg, data } = await getCurrentConversation(
		userInput.meta.conversationId,
	);
	if (!success) {
		throw new Error(msg);
	}

	const conversation = data as ChatConversation;
	const userInputItem = {
		role: 'user',
		content: userInput.data.content,
	};

	// 新会话，注入 sys prompt
	if (conversation.runtimeContent?.length === 0) {
		conversation.runtimeContent.push(getSysPrompt() as Message, {
			role: 'assistant',
			content: '<userCharacteristic>None</userCharacteristic>',
		});
	}

	// 注入用户画像
	if (conversation.runtimeContent?.[1]) {
		const getCharacteristicPrompt = await getCharacteristic(
			userInput.meta.userId,
		);
		conversation.runtimeContent[1] = {
			role: 'assistant',
			content: `<userCharacteristic>${getCharacteristicPrompt.profileSummary}</userCharacteristic>`,
		};
	}

	// 将 userInput 加入 lastMessage 和 raw 会话记录
	conversation.runtimeContent?.push(userInputItem);
	conversation.content.push(userInputItem);

	return {
		userId: userInput.meta.userId,
		conversationId: conversation.meta.id,
		cnn: userInput.meta.connection,
		originalContent: conversation.content as ChatCompletionMessageParam[],
		lastMessages:
			conversation.runtimeContent as ChatCompletionMessageParam[],
		userInput: userInputItem as ChatCompletionUserMessageParam,
		lastMessageIndex: conversation.runtimeContent?.length || 0,
		predictTokenCost: conversation.predictTokenCost as number,
		lastTokenCost: conversation.lastTokenCost as number,
		reactRound: 0,
	};
}

// 一次会话结束，保存上下文
async function setContext(ctx: Memory.Ctx, output: string) {
	const outputItem: ChatCompletionMessageParam = {
		role: 'assistant',
		content: output,
	};
	ctx.originalContent.push(outputItem);
	ctx.lastMessages.push(outputItem);

	await updateConversation(ctx.conversationId, {
		content: ctx.originalContent as Message[],
		runtimeContent: ctx.lastMessages.filter(
			(item) => !item.useOnce,
		) as Message[],
		predictTokenCost: ctx.predictTokenCost,
		lastTokenCost: ctx.lastTokenCost,
	});
}

async function ctxAnalyse(ctx: Memory.Ctx) {
	// 更新 tokenizer 模型
	updateTokenPredictor(ctx.lastTokenCost, ctx.predictTokenCost);

	// token达到上下文窗口的 70% 或者工具调用轮次不少于 2 时，进行上下文压缩
	if (tokenCompute(ctx) / MODAL_CONTEXT_LIMIT >= 0.7 || ctx.reactRound >= 2) {
		let sync: (value: string) => void = () => {};
		const syncSignal = new Promise((resolve) => {
			sync = resolve;
		});
		await summary(ctx, sync);
		const summaryRes = await syncSignal;

		ctx.lastMessages = [
			ctx.lastMessages[0],
			{
				role: 'assistant',
				content: summaryRes as string,
				summary: true,
			},
			ctx.userInput,
		];
	}
}

async function summary(ctx: Memory.Ctx, sync: (value: string) => void) {
	// 启动子 agent 进行上下文无损压缩
	const summary = await runSummaryAgent(ctx.lastMessages);
	// 第一次同步返回 summary 结果：resolve 外部 Promise, 外部信息同步
	sync(summary || '');
	// 后续异步上下文优化同时进行用户画像更新
	runCharacteristicAgent(ctx.userId, {
		time: Date.now().toString(),
		messages: ctx.originalContent.slice(-6),
	});
}

export { getContext, setContext, ctxAnalyse, summary };
