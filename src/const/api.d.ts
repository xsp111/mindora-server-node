type ApiResponse<T> = {
	success: boolean;
	msg: string;
	data?: T;
};

type User4ClientRes = {
	name: string;
	avatar: string;
};

type Message = {
	role: string;
	content: string;
	loading?: boolean;
};

type dbOperationRes<T> = ApiResponse<T>;

// new schema
type ChatConversation = {
	meta: chatConversationMeta;
	content: Message[];
};

type ChatConversationMeta = {
	id: string;
	label: string;
};

type ConversationIdxList = ChatConversationMeta[];

export {
	ApiResponse,
	dbOperationRes,
	User4ClientRes,
	Message,
	ChatConversation,
	ChatConversationMeta,
	ConversationIdxList,
};
