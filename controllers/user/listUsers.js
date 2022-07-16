const User = require('../../models/user');

async function listUsers() {
    try {
        const users = await User.findAll();
        console.log(users);
        return users;
    } catch (error) {
        return error;
    }
}

module.exports = listUsers;