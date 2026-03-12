import msg from '../../../const/msg.js';
import db from '../../../db/index.js';
async function getCurrentMessage(id) {
    try {
        const message = await db.message.findUnique({
            where: {
                id,
            },
        });
        if (!message) {
            return {
                success: false,
                msg: msg.MSG_NOT_FOUND,
            };
        }
        return {
            success: true,
            msg: '',
            data: {
                id: message.id,
                label: message.label,
                msg: message.msg,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            msg: msg.SERVER_ERROR,
        };
    }
}
async function updateMsg(id, newUpdate) {
    try {
        const res = await db.message.update({
            where: {
                id,
            },
            data: newUpdate,
        });
        return {
            success: true,
            msg: '',
            data: {
                id: res.id,
                label: res.label,
                msg: res.msg,
            },
        };
    }
    catch (error) {
        console.log(error);
        return {
            success: false,
            msg: msg.SERVER_ERROR,
        };
    }
}
async function createMsg(newMsg) {
    try {
        const res = await db.message.create({
            data: newMsg,
        });
        return {
            success: true,
            msg: '',
            data: {
                id: res.id,
                label: res.label,
                msg: res.msg,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            msg: msg.SERVER_ERROR,
        };
    }
}
async function deleteMsg(id) {
    try {
        await db.message.delete({
            where: {
                id,
            },
        });
        return {
            success: true,
            msg: '',
        };
    }
    catch (error) {
        return {
            success: false,
            msg: msg.SERVER_ERROR,
        };
    }
}
async function getMsgList(userId) {
    try {
        const message = await db.message.findMany({
            where: {
                userId,
            },
        });
        return {
            success: true,
            msg: '',
            data: message.map((item) => ({
                id: item.id,
                label: item.label,
            })),
        };
    }
    catch (error) {
        return {
            success: false,
            msg: msg.SERVER_ERROR,
        };
    }
}
export { getCurrentMessage, createMsg, getMsgList, deleteMsg, updateMsg };
