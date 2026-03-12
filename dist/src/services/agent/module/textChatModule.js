import coreLLM from './model.js';
export default async function entry(msg) {
    const res = await coreLLM.stream(msg);
    return res;
}
class TextAgent {
    state;
    baseLLm;
    constructor() {
        this.baseLLm = coreLLM;
        this.state = {};
    }
}
export { TextAgent };
