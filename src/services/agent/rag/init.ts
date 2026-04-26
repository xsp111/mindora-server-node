import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantClient } from '@qdrant/js-client-rest';
import 'dotenv/config';

export const COLLECTION = 'mindora_rag';
export type chunk = {
	source_file: string;
	chapter_title: string;
	section_path: string[];
	line_range: {
		start: number;
		end: number;
	};
	chunk_index_in_section: number;
	concept_type: string;
	original_text: string;
	rag_overview: string;
};

export const embeddings = new OpenAIEmbeddings({
	apiKey: process.env.API_KEY,
	configuration: {
		baseURL: process.env.API_BASE_URL,
	},
	model: process.env.EMBEDDING_MODEL,
	dimensions: 1024,
});

const client = new QdrantClient({ host: 'localhost', port: 6333 });
export default client;
