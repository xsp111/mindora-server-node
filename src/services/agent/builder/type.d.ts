import type { Context as ConnContext } from 'hono';
import type { chatMsg } from '../../../const/api.js';

type StateMachine = {
	state: GraphNode['state'] | 'start' | 'end'; // 来自由节点描述的状态集，用于判断当前状态
	ctx: Ctx;
	nodes: Map<GraphNode['state'], GraphNode>; // 节点集，由节点描述的状态作为键
	addNode(graphNode: GraphNode); // 添加节点，节点需要对下一个状态进行描述
	build(): StateMachine | Error; // 检查状态机是否完整可运行, 若完整则返回状态机, 否则抛出错误
	run(initState: InitState); // 运行状态机
};

type Ctx = {
	name: string;
	userInputType: 'text' | 'voice';
	connCtx: ConnContext;
	nodeInput?: number;
	memory: chatMsg;
};

type InitState = {
	baseCtx: Ctx;
};

type GraphNode = {
	state: string;
	desc: string;
	run(ctx: Ctx): Promise<GraphNodeOutput>;
};

type GraphNodeOutput = {
	next: GraphNode['state'];
};
