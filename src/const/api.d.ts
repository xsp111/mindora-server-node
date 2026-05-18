type ApiResponse<T> = {
	success: boolean;
	msg: string;
	data?: T;
};

type EditUserInfo = {
	name?: string;
	email?: string;
	avatar?: File;
};

type User4ClientRes = {
	name: string;
	avatar: string;
	email?: string;
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
	runtimeContent?: Message[];
	predictTokenCost?: number;
	lastTokenCost?: number;
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
	EditUserInfo,
	Message,
	ChatConversation,
	ChatConversationMeta,
	ConversationIdxList,
};
