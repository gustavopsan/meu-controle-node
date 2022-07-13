const Sequelize = require('sequelize');
const database = require('../db');

const User = database.define('user', {
    userId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    subscriptionType: {
        type: Sequelize.STRING,
        allowNull: false
    }
})

module.exports = User;