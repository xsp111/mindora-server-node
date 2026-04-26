import { readFileSync } from 'fs';
import client, { COLLECTION, embeddings, type chunk } from './init.js';

await client.recreateCollection(COLLECTION, {
	vectors: {
		size: 1024,
		distance: 'Cosine',
	},
});

async function embedWithBatch(texts: string[], batchSize = 10) {
	const results: number[][] = [];

	for (let i = 0; i < texts.length; i += batchSize) {
		const batch = texts.slice(i, i + batchSize);
		const vectors = await embeddings.embedDocuments(batch);

		console.log(`processed ${i} to ${i + vectors.length}`);
		results.push(...vectors);
	}

	return results;
}

async function insertChunks() {
	const chunksJson = readFileSync(
		'./src/services/agent/rag/doc/chunks.json',
		'utf-8',
	);
	const chunks: chunk[] = JSON.parse(chunksJson);
	const texts = chunks.map((c) => c.rag_overview);
	const vectors = await embedWithBatch(texts);
	const operationInfo = await client.upsert(COLLECTION, {
		points: chunks.map((c, index) => {
			return {
				id: index,
				vector: vectors[index],
				payload: {
					overview: c.rag_overview,
					original_text: c.original_text,
				},
			};
		}),
	});

	console.log(operationInfo);
}

(async () => {
	try {
		await insertChunks();
	} catch (error) {
		console.error(error);
	}
})();
