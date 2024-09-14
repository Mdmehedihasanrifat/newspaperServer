"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserModel = exports.User = void 0;
const sequelize_1 = require("sequelize");
// Create the User class, extending Sequelize's Model class
class User extends sequelize_1.Model {
}
exports.User = User;
const createUserModel = (sequelize) => {
    User.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        firstName: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
        },
        lastName: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
        },
        email: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        password: {
            type: sequelize_1.DataTypes.STRING(150),
            allowNull: false,
        },
        profile: {
            type: sequelize_1.DataTypes.STRING(250),
            allowNull: true,
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize,
        tableName: 'Users',
    });
    return User;
};
exports.createUserModel = createUserModel;
