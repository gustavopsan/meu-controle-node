const User = require('../../models/user');

async function checkEmail(email) {
    try {
        const user = await User.findOne({
            where: {
                email: email
            }
        })
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = checkEmail;