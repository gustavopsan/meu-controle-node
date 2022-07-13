const User = require('../../models/user');

async function createUser(name, email, password, subscriptionType) {
    try {
        const userCreated = await User.create({
            name,
            email,
            password,
            subscriptionType
        });
        return userCreated;
    } catch (error) {
        return error;
    }
}

module.exports = createUser;