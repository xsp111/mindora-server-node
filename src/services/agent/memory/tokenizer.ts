import { get_encoding } from 'tiktoken';
import type { Memory } from '../type.js';

const DynamicTokenFactor = {
	TOKENIZER_FACTOR: 1.0,
	lr: 0.3,

	encoder: get_encoding('o200k_base'),

	TOKENS_PER_MESSAGE: 4,
	BASE_REPLY_TOKENS: 3,
	TOOL_PER_SYS_COST: 15,
};

const MODAL_CONTEXT_LIMIT =
	Number(process.env.MODAL_CONTEXT_LIMIT || 0) || 1000000; // 上下文窗口大小, 默认 1M

function tokenCompute(ctx: Memory.Ctx): number {
	const baseTokenCost = calBaseTokenCost(ctx.lastMessages, ctx.tools);
	return (ctx.predictTokenCost = dynPredict(baseTokenCost));
}

function updateTokenPredictor(actualTokens: number, predictTokenCost: number) {
	if (predictTokenCost <= 0) return;
	const currentRatio = actualTokens / predictTokenCost;

	// EMA 指数移动平均更新
	DynamicTokenFactor.TOKENIZER_FACTOR =
		DynamicTokenFactor.lr * currentRatio +
		(1 - DynamicTokenFactor.lr) * DynamicTokenFactor.TOKENIZER_FACTOR;

	// 限制动态因子数值范围
	DynamicTokenFactor.TOKENIZER_FACTOR = Math.max(
		0.5,
		Math.min(DynamicTokenFactor.TOKENIZER_FACTOR, 2.0),
	);
}

function tokenizer(text: string) {
	if (!DynamicTokenFactor.encoder)
		DynamicTokenFactor.encoder = get_encoding('o200k_base');
	return DynamicTokenFactor.encoder.encode(text).length;
}

function calBaseTokenCost(
	messages: Memory.Ctx['lastMessages'],
	tools: Memory.Ctx['tools'],
): number {
	let baseTokens = 0;

	for (const msg of messages) {
		baseTokens += DynamicTokenFactor.TOKENS_PER_MESSAGE;
		if (msg.content) {
			baseTokens += tokenizer(msg.content as string);
		}
		baseTokens += tokenizer(msg.role);
	}

	if (tools && tools.length > 0) {
		const toolsString = JSON.stringify(tools);
		baseTokens += tokenizer(toolsString);
		// sdk 处理 tools 的固定隐性开销
		baseTokens += tools.length * DynamicTokenFactor.TOOL_PER_SYS_COST;
	}

	baseTokens += DynamicTokenFactor.BASE_REPLY_TOKENS;
	return baseTokens;
}

function dynPredict(baseTokenCost: number) {
	const predicted = baseTokenCost * DynamicTokenFactor.TOKENIZER_FACTOR;
	return Math.ceil(predicted);
}

export { MODAL_CONTEXT_LIMIT, tokenCompute, updateTokenPredictor };
