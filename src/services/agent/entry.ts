import run from './runAgent.js';
import type { StreamingApi } from 'hono/utils/stream';

export default async function entry({
	userId,
	conversationId,
	stream,
	content,
}: {
	userId: string;
	conversationId: string;
	stream: StreamingApi;
	content: string;
}) {
	const res = await run({
		meta: {
			userId,
			conversationId,
			connection: {
				async send(msg: string | ArrayBuffer) {
					await stream.write(
						msg as string | Uint8Array<ArrayBufferLike>,
					);
				},
			},
		},
		data: {
			content,
		},
	});
}
