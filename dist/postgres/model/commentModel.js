"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentModel = void 0;
const sequelize_1 = require("sequelize");
// Define the Comment model
const createCommentModel = (sequelize) => {
    const Comment = sequelize.define('Comment', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: 'Users', // Ensure this matches the actual model name
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        newsId: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: 'News', // Ensure this matches the actual model name
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        comment: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false
        }
    }, {
        timestamps: true, // Sequelize will manage createdAt and updatedAt
        tableName: 'Comments' // Explicitly define table name
    });
    return Comment;
};
exports.createCommentModel = createCommentModel;
