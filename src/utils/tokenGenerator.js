const crypto = require('crypto');

function generateToken() {
    const token = crypto.randomBytes(16).toString('hex');
    console.log("🧪 TOKEN INSIDE GENERATOR:", token);
    return token;
}

module.exports = generateToken;