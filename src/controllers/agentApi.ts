import type { Context } from 'hono';
import { stream } from 'hono/streaming';
import * as agent from '../services/agent/index.js';
import type { ChatConversation } from '../const/api.js';
import { memoryApiService } from '../services/agent/memory/index.js';
import { authService } from '../services/index.js';

async function chat(c: Context) {
	const {
		meta: { id, label },
		content,
	}: ChatConversation = await c.req.json();
	const clearContent = content.filter((item) => !item.loading);
	const accessToken = c.req
		.header('Authorization')
		?.replace('Bearer ', '') as string;
	const { data } = await authService.verifyAccessToken(accessToken);
	const userId = data?.id as string;
	const res = await agent.textChat(JSON.stringify(clearContent));
	return stream(c, async (stream) => {
		let finalMsg = '';
		for await (const chunk of res) {
			const resMsg = chunk.content as string;
			await stream.write(resMsg);
			finalMsg += resMsg;
		}
		await memoryApiService.updateConversation(id, {
			content: [
				...clearContent,
				{
					role: 'assistant',
					content: finalMsg,
				},
			],
		});
	});
}

async function createConversation(c: Context) {
	const accessToken = c.req
		.header('Authorization')
		?.replace('Bearer ', '') as string;
	const authRes = await authService.verifyAccessToken(accessToken);
	const userId = authRes.data?.id as string;
	const defaultLabel = '新对话';
	const { success, msg, data } = await memoryApiService.createConversation({
		userId: userId,
		label: defaultLabel,
		content: [],
	});
	if (!success) {
		return c.json({
			success: false,
			msg: msg,
		});
	}
	return c.json({
		success: success,
		msg: msg,
		data: {
			meta: {
				id: data?.meta?.id || '',
				label: data?.meta?.label || defaultLabel,
			},
			content: [],
		},
	});
}

async function deleteConversation(c: Context) {
	const { id } = await c.req.json();
	const { success, msg } = await memoryApiService.deleteConversation(id);
	if (!success) {
		return c.json({
			success: false,
			msg: msg,
		});
	}
	return c.json({
		success: success,
		msg: msg,
	});
}

async function newLabel(c: Context) {
	const { id, label } = await c.req.json();
	const { success, msg } = await memoryApiService.updateConversation(id, {
		label: label,
	});
	if (!success) {
		return c.json({
			success: false,
			msg: msg,
		});
	}
	return c.json({
		success: success,
		msg: msg,
	});
}

async function get(c: Context) {
	const { id } = await c.req.json();
	const { success, msg, data } =
		await memoryApiService.getCurrentConversation(id);
	if (!success) {
		return c.json({
			success: false,
			msg: msg,
		});
	}
	return c.json({
		success: success,
		msg: msg,
		data: {
			meta: {
				id: data?.meta?.id || '',
				label: data?.meta?.label || '',
			},
			content: data?.content || [],
		},
	});
}

async function getConversationList(c: Context) {
	const accessToken = c.req
		.header('Authorization')
		?.replace('Bearer ', '') as string;
	const authRes = await authService.verifyAccessToken(accessToken);
	const userId = authRes.data?.id as string;
	const { success, msg, data } =
		await memoryApiService.getConversationList(userId);
	if (!success) {
		return c.json({
			success: false,
			msg: msg,
		});
	}
	return c.json({
		success: success,
		msg: msg,
		data:
			data?.map((item) => ({
				idx: item.id,
				label: item.label || '',
			})) || [],
	});
}

export {
	chat,
	createConversation,
	get,
	getConversationList,
	deleteConversation,
	newLabel,
};
