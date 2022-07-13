const User = require('../../models/user');

async function listUsers() {
    try {
        const users = await User.findAll();
        return users;
    } catch (error) {
        return error;
    }
}

module.exports = listUsers;