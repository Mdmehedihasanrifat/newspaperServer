"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategoryModel = void 0;
const sequelize_1 = require("sequelize");
// Define the Category model
const createCategoryModel = (sequelize) => {
    const Category = sequelize.define('Category', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW
        }
    }, {
        tableName: 'Categories' // Explicitly define table name
    });
    return Category;
};
exports.createCategoryModel = createCategoryModel;
