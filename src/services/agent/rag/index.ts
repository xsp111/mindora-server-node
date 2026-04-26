import client, { COLLECTION, embeddings } from './init.js';

export default async function query(input: string): Promise<string> {
	const vector = await embeddings.embedQuery(input);
	const res = await client.query(COLLECTION, {
		query: vector,
		limit: 3,
		with_payload: true,
	});
	return `参考文献:\n${res.points.map((p) => `摘要:${p?.payload?.overview || ''}\n内容:${p?.payload?.original_text || ''}`).join('\n')}`;
}
