
const DB = require('../db');

async function Connect() {
    try {
        const response = await DB.sync();
        return response;
    } catch (error) {
        return error;
    }
}

module.exports = Connect;