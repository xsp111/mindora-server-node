import model from '../module/model.js';
import getSysPrompt from '../prompt/index.js';
import type { Memory } from '../type.js';

export default async function run(conversation: Memory.Ctx['lastMessages']) {
	const sysPrompt = getSysPrompt('summary');
	const summaryRes = await model.send([sysPrompt, ...conversation], {
		stream: false,
		enable_thinking: false,
	});
	return summaryRes.choices[0].message.content;
}
