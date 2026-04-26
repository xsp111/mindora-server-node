import msg from '@/const/msg.js';
import db from '@/db/index.js';
import model from '../module/model.js';
import getSysPrompt from '../prompt/index.js';
import type { Memory } from '../type.js';

export default async function run(
	userId: string,
	newConversation: { time: string; messages: Memory.Ctx['originalContent'] },
) {
	console.log('update characteristic');
	const characteristic = await db.characteristic.findFirst({
		where: {
			userId,
		},
	});

	if (!characteristic) {
		throw new Error(msg.CHARACTERISTIC_NOT_EXIST);
	}

	const sysPrompt = getSysPrompt('characteristic');

	const input = `<characteristic>${JSON.stringify(characteristic)}</characteristic>
<conversations><time>${newConversation.time}</time>${JSON.stringify(newConversation.messages)}</conversations>`;

	// feed characteristic to model
	const res = await model.send(
		[sysPrompt, { role: 'user', content: input }],
		{
			enable_thinking: false,
			response_format: {
				type: 'json_object',
			},
		},
	);

	const jsonResStr = res.choices[0].message.content;

	console.log('jsonResStr', jsonResStr);

	if (jsonResStr) {
		const jsonRes: Memory.characteristic = JSON.parse(jsonResStr);
		await db.characteristic.update({
			where: {
				id: characteristic.id,
			},
			data: jsonRes,
		});
	}
}
