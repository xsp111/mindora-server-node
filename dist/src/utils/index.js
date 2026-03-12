function base64UrlEncode(input) {
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
    return Buffer.from(bytes)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
async function hmacSha256(key, data) {
    const signature = await getHashSignature(key, data);
    return new Uint8Array(signature);
}
async function getHashSignature(secret, data) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    return signature;
}
async function getHashRefreshToken(refreshToken, serverSecret) {
    const signature = await getHashSignature(serverSecret, refreshToken);
    return Buffer.from(signature).toString('hex');
}
function getApiRes() {
    return {
        success: false,
        msg: '',
        data: {},
    };
}
export { base64UrlEncode, hmacSha256, getHashRefreshToken, getHashSignature, getApiRes, };
