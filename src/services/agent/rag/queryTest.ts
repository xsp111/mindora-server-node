import client, { COLLECTION, embeddings } from './init.js';

(async () => {
	try {
		const text = '我考试考砸了';
		const vector = await embeddings.embedQuery(text);

		const res = await client.query(COLLECTION, {
			query: vector,
			limit: 3,
			with_payload: true,
		});
		console.log(res.points);
	} catch (error) {
		console.error(error);
	}
})();
