const User = require('../../models/user');

async function doLogin(email, password) {
    try {
        const user = await User.findOne({
            where: {
                email: email,
                password: password
            }
        })
        return user;
    } catch (error) {
        return error;
    }
}

module.exports = doLogin;