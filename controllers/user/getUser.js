const User = require('../../models/user');

async function getUser(id) {
    try {
        const user = await User.findOne({
            where: {
                userId: id
            }
        })
        return user;
    } catch (error) {
        return error;
    }
}

module.exports = getUser;