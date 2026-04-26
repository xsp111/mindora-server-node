import type { Context } from 'hono';
import { stream } from 'hono/streaming';
import { memoryApiService } from '@agent/memory/index.js';
import { authService } from '@services/index.js';
import entry from '@/services/agent/entry.js';

async function chat(c: Context) {
	try {
		const { conversationId, content } = await c.req.json();
		const accessToken = c.req
			.header('Authorization')
			?.replace('Bearer ', '') as string;
		const { data } = await authService.verifyAccessToken(accessToken);
		const userId = data?.id as string;
		return stream(c, async (stream) => {
			await entry({
				userId,
				conversationId,
				stream,
				content,
			});
		});
	} catch (err) {
		console.error(err);
	}
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
		runtimeContent: [],
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
			content:
				data?.content?.filter(
					(item) => item.role === 'user' || item.role === 'assistant',
				) || [],
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

async function getCharacteristic(c: Context) {
	const accessToken = c.req
		.header('Authorization')
		?.replace('Bearer ', '') as string;
	const authRes = await authService.verifyAccessToken(accessToken);
	const userId = authRes.data?.id as string;
	const characteristic = await memoryApiService.getCharacteristic(userId);
	return c.json({
		success: true,
		msg: '',
		data: characteristic,
	});
}

export {
	chat,
	createConversation,
	get,
	getConversationList,
	deleteConversation,
	newLabel,
	getCharacteristic,
};
