"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategoryNewsModel = void 0;
const sequelize_1 = require("sequelize");
// Define the join table CategoryNews model
const createCategoryNewsModel = (sequelize) => {
    const CategoryNews = sequelize.define('CategoryNews', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        newsId: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: 'News', // Refers to the News model
                key: 'id'
            },
            onDelete: 'CASCADE' // Cascading delete if News is deleted
        },
        categoryId: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: 'Categories', // Refers to the Category model
                key: 'id'
            },
            onDelete: 'CASCADE' // Cascading delete if Category is deleted
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
        tableName: 'CategoryNews' // Explicitly define table name
    });
    return CategoryNews;
};
exports.createCategoryNewsModel = createCategoryNewsModel;
