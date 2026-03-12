import coreLLM from './model.js';

export default async function entry(msg: string) {
	const res = await coreLLM.stream(msg);
	return res;
}

class TextAgent {
	state: Record<string, any>;
	baseLLm: typeof coreLLM;
	constructor() {
		this.baseLLm = coreLLM;
		this.state = {};
	}
}

export { TextAgent };
