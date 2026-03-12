import { stream } from 'hono/streaming';
import * as agent from '../services/agent/index.js';
import { memoryApiService } from '../services/agent/memory/index.js';
import { authService } from '../services/index.js';
async function chat(c) {
    const currentMsg = await c.req.json();
    currentMsg.msg = currentMsg.msg.filter((item) => !item.loading);
    const accessToken = c.req
        .header('Authorization')
        ?.replace('Bearer ', '');
    const { data } = await authService.verifyAccessToken(accessToken);
    const userId = data?.id;
    const res = await agent.textChat(JSON.stringify(currentMsg.msg));
    return stream(c, async (stream) => {
        let finalMsg = '';
        for await (const chunk of res) {
            const resMsg = chunk.content;
            await stream.write(resMsg);
            finalMsg += resMsg;
        }
        await memoryApiService.updateMsg(currentMsg.id, {
            msg: [...currentMsg.msg, { role: 'assistant', content: finalMsg }],
        });
    });
}
async function createMsg(c) {
    const accessToken = c.req
        .header('Authorization')
        ?.replace('Bearer ', '');
    const authRes = await authService.verifyAccessToken(accessToken);
    const userId = authRes.data?.id;
    const { success, msg, data } = await memoryApiService.createMsg({
        userId: userId,
        label: '新对话',
        msg: [],
    });
    if (!success) {
        return c.json({
            success: false,
            msg: msg,
        });
    }
    return c.json({
        success: success,
        msg: msg,
        data: data,
    });
}
async function deleteMsg(c) {
    const { id } = await c.req.json();
    const { success, msg } = await memoryApiService.deleteMsg(id);
    if (!success) {
        return c.json({
            success: false,
            msg: msg,
        });
    }
    return c.json({
        success: success,
        msg: msg,
    });
}
async function newLabel(c) {
    const { id, label } = await c.req.json();
    const { success, msg } = await memoryApiService.updateMsg(id, {
        label: label,
    });
    if (!success) {
        return c.json({
            success: false,
            msg: msg,
        });
    }
    return c.json({
        success: success,
        msg: msg,
    });
}
async function get(c) {
    const { id } = await c.req.json();
    const { success, msg, data } = await memoryApiService.getCurrentMessage(id);
    if (!success) {
        return c.json({
            success: false,
            msg: msg,
        });
    }
    return c.json({
        success: success,
        msg: msg,
        data: data,
    });
}
async function getMsgList(c) {
    const accessToken = c.req
        .header('Authorization')
        ?.replace('Bearer ', '');
    const authRes = await authService.verifyAccessToken(accessToken);
    const userId = authRes.data?.id;
    const { success, msg, data } = await memoryApiService.getMsgList(userId);
    if (!success) {
        return c.json({
            success: false,
            msg: msg,
        });
    }
    return c.json({
        success: success,
        msg: msg,
        data: data?.map((item) => ({
            idx: item.id,
            label: item.label || '',
        })) || [],
    });
}
export { chat, createMsg, get, getMsgList, deleteMsg, newLabel };
