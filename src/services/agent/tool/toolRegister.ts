import type { ChatCompletionTool } from 'openai/resources';

type Tool = {
	name: string;
	toolDesc: ChatCompletionTool;
	fn: Function;
};

export type ToolList = {
	name: string;
	toolDesc: ChatCompletionTool;
	fn: Function;
}[];

export const toolList = new Map<string, Tool>();

export default function registerTools(toolInfo: Tool) {
	toolList.set(toolInfo.name, toolInfo);
}

// export function builtinToolsRegister() {
// 	return [...fileTools, ...execTools].forEach((tool) => registerTools(tool));
// }
