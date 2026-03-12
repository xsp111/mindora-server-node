import type { Context } from 'hono';
import type * as StateMachineType from './type.js';

// export function Agent(): StateMachineType.StateMachine {
// 	return {
// 		state: 'start',
// 		context: {} as StateMachineType.Context,
// 		nodes: new Map(),
// 		addNode(graphNode: StateMachineType.GraphNode) {
// 			this.nodes.set(graphNode.state, graphNode);
// 		},
// 		next() {
// 			return this.nodes.get(this.state);
// 		},
// 		build() {
// 			if (!this.nodes.has('start')) {
// 				throw new Error('Start node is missing');
// 			}
// 			if (!this.nodes.has('end')) {
// 				throw new Error('End node is missing');
// 			}
// 			return this;
// 		},
// 		async run(initState: StateMachineType.InitState) {
// 			this.state = 'start';
// 			while (this.state !== 'end') {
// 				const node = this.next();
// 				if (!node) {
// 					throw new Error(`No node found for state ${this.state}`);
// 				}
// 				this.state = node.state;
// 				const output = await node.exec(this.next);
// 			}
// 		},
// 	};
// }

function StateMachine(): StateMachineType.StateMachine {
	return {
		state: 'start',
		ctx: {} as StateMachineType.Ctx,
		nodes: new Map(),
		addNode(graphNode: StateMachineType.GraphNode) {
			this.nodes.set(graphNode.state, graphNode);
		},
		build() {
			if (!this.nodes.has('start')) {
				throw new Error('Start node is missing');
			}
			if (!this.nodes.has('end')) {
				throw new Error('End node is missing');
			}
			return this;
		},
		async run(initState: StateMachineType.InitState) {
			const { baseCtx } = initState;
			this.ctx = baseCtx;
			let nextNodeIndex: StateMachineType.GraphNode['state'] = 'start';
			while (this.state !== 'end') {
				const node = this.nodes.get(nextNodeIndex);
				if (!node) {
					throw new Error(`No node found for state ${this.state}`);
				}
				this.state = node.state;
				console.log(
					`current state: ${this.state}, current input: ${this.ctx.nodeInput}`,
				);
				const { next } = await node.run(this.ctx);
				nextNodeIndex = next;
			}
			return;
		},
	};
}

const stateMachine = StateMachine();
stateMachine.addNode({
	state: 'start',
	desc: 'Start node',
	run(ctx: StateMachineType.Ctx) {
		return Promise.resolve({ next: 'first' });
	},
});
stateMachine.addNode({
	state: 'first',
	desc: 'First node',
	run(ctx: StateMachineType.Ctx) {
		const { nodeInput } = ctx;
		if (!nodeInput) {
			throw new Error('nodeInput is missing');
		}
		ctx.nodeInput = nodeInput ** 2;
		return Promise.resolve({ next: 'second' });
	},
});
stateMachine.addNode({
	state: 'second',
	desc: 'Second node',
	run(ctx: StateMachineType.Ctx) {
		const { nodeInput } = ctx;
		if (!nodeInput) {
			throw new Error('nodeInput is missing');
		}
		const nextInput = nodeInput - 4;
		ctx.nodeInput = nextInput;
		return Promise.resolve({
			next: nextInput > 100 ? 'end' : 'first',
		});
	},
});
stateMachine.addNode({
	state: 'end',
	desc: 'End node',
	run(ctx: StateMachineType.Ctx) {
		return Promise.resolve({ next: 'end' });
	},
});

stateMachine.run({
	baseCtx: {
		name: 'test',
		userInputType: 'text',
		nodeInput: 3,
		connCtx: {} as Context,
		memory: {
			id: '1',
			label: 'test',
			msg: [],
		},
	},
});
