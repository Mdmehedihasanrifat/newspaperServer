"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewsModel = void 0;
const sequelize_1 = require("sequelize");
const createNewsModel = (sequelize) => {
    const News = sequelize.define('News', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false
        },
        image: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true
        },
        categoryId: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: 'category',
                key: 'id'
            }
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW
        }
    });
    return News;
};
exports.createNewsModel = createNewsModel;
