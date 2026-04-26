import type {
	ChatConversation,
	ChatConversationMeta,
	ConversationIdxList,
	dbOperationRes,
	Message,
} from '@/const/api.js';
import msg from '@/const/msg.js';
import db from '@/db/index.js';
import type { Memory } from '../type.js';

async function getCurrentConversation(
	id: string,
): Promise<dbOperationRes<ChatConversation>> {
	try {
		const conversation = await db.conversation.findUnique({
			where: {
				id,
			},
		});
		if (!conversation) {
			return {
				success: false,
				msg: msg.MSG_NOT_FOUND,
			};
		}
		return {
			success: true,
			msg: '',
			data: {
				meta: {
					id: conversation.id,
					label: conversation.label,
				},
				content: conversation.content as Message[],
				runtimeContent: conversation.runtimeContent as Message[],
				predictTokenCost: conversation.predictTokenCost || 0,
				lastTokenCost: conversation.lastTokenCost || 0,
			},
		};
	} catch (error) {
		console.error(error);
		return {
			success: false,
			msg: msg.SERVER_ERROR,
		};
	}
}

async function updateConversation(
	id: string,
	newUpdate: Partial<
		ChatConversationMeta & {
			content?: Message[];
			runtimeContent?: Message[];
			predictTokenCost?: number;
			lastTokenCost?: number;
		}
	>,
): Promise<dbOperationRes<ChatConversation>> {
	try {
		const { label, content } = await db.conversation.update({
			where: {
				id,
			},
			data: newUpdate,
		});
		return {
			success: true,
			msg: '',
			data: {
				meta: {
					id: id,
					label: label,
				},
				content: content as Message[],
			},
		};
	} catch (error) {
		console.error(error);
		return {
			success: false,
			msg: msg.SERVER_ERROR,
		};
	}
}

async function createConversation(
	newMsg: Pick<ChatConversationMeta, 'label'> & {
		userId: string;
		content: ChatConversation['content'];
		runtimeContent: ChatConversation['runtimeContent'];
	},
): Promise<dbOperationRes<ChatConversation>> {
	try {
		const { id, label, content, runtimeContent } =
			await db.conversation.create({
				data: newMsg,
			});
		return {
			success: true,
			msg: '',
			data: {
				meta: {
					id: id,
					label: label,
				},
				content: content as Message[],
				runtimeContent: runtimeContent as Message[],
			},
		};
	} catch (error) {
		console.error(error);
		return {
			success: false,
			msg: msg.SERVER_ERROR,
		};
	}
}

async function deleteConversation(id: string): Promise<dbOperationRes<void>> {
	try {
		await db.conversation.delete({
			where: {
				id,
			},
		});
		return {
			success: true,
			msg: '',
		};
	} catch (error) {
		console.error(error);
		return {
			success: false,
			msg: msg.SERVER_ERROR,
		};
	}
}

async function getConversationList(
	userId: string,
): Promise<dbOperationRes<ConversationIdxList>> {
	try {
		const conversationList = await db.conversation.findMany({
			where: {
				userId,
			},
		});
		return {
			success: true,
			msg: '',
			data: conversationList.map((item) => ({
				id: item.id,
				label: item.label,
			})),
		};
	} catch (error) {
		console.error(error);
		return {
			success: false,
			msg: msg.SERVER_ERROR,
		};
	}
}

async function getCharacteristic(
	userId: string,
): Promise<Memory.characteristic> {
	const characteristic = await db.characteristic.findFirst({
		where: {
			userId,
		},
	});
	if (!characteristic) {
		throw new Error(msg.CHARACTERISTIC_NOT_EXIST);
	}
	return characteristic as unknown as Memory.characteristic;
}

export {
	getCurrentConversation,
	createConversation,
	getConversationList,
	deleteConversation,
	updateConversation,
	getCharacteristic,
};
