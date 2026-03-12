import type {
	ChatConversation,
	ChatConversationMeta,
	ConversationIdxList,
	dbOperationRes,
	Message,
} from '../../../const/api.js';
import msg from '../../../const/msg.js';
import db from '../../../db/index.js';

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
			},
		};
	} catch (error) {
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
			label?: string;
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
		console.log(error);
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
	},
): Promise<dbOperationRes<ChatConversation>> {
	try {
		const { id, label, content } = await db.conversation.create({
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
			},
		};
	} catch (error) {
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
		return {
			success: false,
			msg: msg.SERVER_ERROR,
		};
	}
}

export {
	getCurrentConversation,
	createConversation,
	getConversationList,
	deleteConversation,
	updateConversation,
};
