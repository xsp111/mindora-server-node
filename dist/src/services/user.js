import db from '../db/index.js';
import msg from '../const/msg.js';
async function createUser(signupParams) {
    try {
        const user = await db.user.create({
            data: signupParams,
        });
        return {
            success: true,
            msg: '',
            data: user,
        };
    }
    catch (error) {
        return {
            success: false,
            msg: msg.USER_NAME_ALREADY_EXISTS,
        };
    }
}
async function getUser(searchParams) {
    try {
        const user = await db.user.findUnique({
            where: searchParams,
        });
        return {
            success: true,
            msg: '',
            data: user,
        };
    }
    catch (error) {
        return {
            success: false,
            msg: msg.SERVER_ERROR,
        };
    }
}
export { createUser, getUser };
