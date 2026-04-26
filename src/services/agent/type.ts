import type OpenAI from 'openai';
import type {
	ChatCompletionMessageFunctionToolCall,
	ChatCompletionMessageParam,
	ChatCompletionTool,
	ChatCompletionUserMessageParam,
} from 'openai/resources';
import type { Stream } from 'openai/streaming';

export namespace Client {
	export type input = {
		meta: {
			userId: string;
			conversationId: string;
			connection?: {
				send: (data: string | ArrayBuffer) => void;
			}; // client 连接
		};
		data: {
			content: string;
		};
	};

	export type output = {
		type: 'during' | 'final' | 'error';
		data: {
			content: string | ArrayBuffer;
		};
	};
}

export namespace Memory {
	type MessageExtsMeta = {
		useOnce?: boolean;
		summary?: boolean;
	};
	export type Ctx = {
		userId: string;
		conversationId: string;
		originalContent: ChatCompletionMessageParam[];
		lastMessages: (ChatCompletionMessageParam & MessageExtsMeta)[];
		userInput: ChatCompletionUserMessageParam;
		lastMessageIndex: number;

		predictTokenCost: number;
		lastTokenCost: number;

		reactRound: number;
		tools?: Tool.Tools;
		cnn?: Client.input['meta']['connection']; // client 连接
	};

	export type characteristic = {
		profileSummary: string;
		overview: string;
		emotionTrend7d: Array<{ date: 'YYYY-MM-DD'; valence: number }>;
		dimensions: {
			valence: number;
			arousal: number;
			stress: number;
			cognitive_distortion: number;
			regulation: number;
			risk: number;
		};
		suggestions: Array<string>;
		insights: {
			summary: string;
			keywords: Array<string>;
		};
	};
}

export namespace Tool {
	export type tool = ChatCompletionTool;
	export type Tools = tool[];
	export type ToolCalls = ChatCompletionMessageFunctionToolCall[];
}

export namespace Model {
	export type StreamRes =
		Stream<OpenAI.Chat.Completions.ChatCompletionChunk> & {
			_request_id?: string | null;
		};

	export type Res = OpenAI.Chat.Completions.ChatCompletion;
}
