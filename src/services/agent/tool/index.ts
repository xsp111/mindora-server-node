import { toolList } from './toolRegister.js';
import type { Memory, Tool } from '../type.js';

let tools: Tool.Tools | null = null;

export default async function useTools(
	ctx: Memory.Ctx,
	toolCalls: Tool.ToolCalls,
) {
	await Promise.all(
		toolCalls.map(async (call) => {
			const { name, arguments: paramsStr } = call.function;
			const toolInfo = toolList.get(name);
			if (!toolInfo) {
				throw new Error(`工具 ${name} 不存在`);
			}
			const ExecResult = await toolInfo.fn(JSON.parse(paramsStr));
			ctx.lastMessages.push({
				role: 'tool',
				content: JSON.stringify(ExecResult),
				tool_call_id: call.id,
			});
		}),
	);
}

export function getAvailableTools() {
	return (
		tools || (tools = [...toolList.values()].map((tool) => tool.toolDesc))
	);
}
