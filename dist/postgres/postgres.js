"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryNewsModel = exports.categoryModel = exports.commentModel = exports.newsModel = exports.userModel = exports.connection = void 0;
const sequelize_1 = require("sequelize");
const userModel_1 = require("./model/userModel");
const newsModel_1 = require("./model/newsModel");
const commentModel_1 = require("./model/commentModel");
const categoryModel_1 = require("./model/categoryModel");
const categoryNewsModel_1 = require("./model/categoryNewsModel");
const sequelize = new sequelize_1.Sequelize('postgres', 'postgres', 'h1997asaN#@', {
    host: 'localhost',
    dialect: 'postgres'
});
const userModel = (0, userModel_1.createUserModel)(sequelize);
exports.userModel = userModel;
const newsModel = (0, newsModel_1.createNewsModel)(sequelize);
exports.newsModel = newsModel;
const commentModel = (0, commentModel_1.createCommentModel)(sequelize);
exports.commentModel = commentModel;
const categoryModel = (0, categoryModel_1.createCategoryModel)(sequelize);
exports.categoryModel = categoryModel;
const categoryNewsModel = (0, categoryNewsModel_1.createCategoryNewsModel)(sequelize);
exports.categoryNewsModel = categoryNewsModel;
// Associations between User, News, and Comment models
userModel.hasMany(newsModel, { foreignKey: 'userId', as: 'news', onDelete: 'CASCADE' });
newsModel.belongsTo(userModel, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
userModel.hasMany(commentModel, { foreignKey: 'userId', as: 'comment', onDelete: 'CASCADE' });
commentModel.belongsTo(userModel, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
newsModel.hasMany(commentModel, { foreignKey: 'newsId', onDelete: 'CASCADE' });
commentModel.belongsTo(newsModel, { foreignKey: 'newsId', onDelete: 'CASCADE' });
newsModel.belongsToMany(categoryModel, { through: categoryNewsModel, foreignKey: 'newsId', as: 'categories' });
categoryModel.belongsToMany(newsModel, { through: categoryNewsModel, foreignKey: 'categoryId', as: 'news' });
const connection = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sequelize.authenticate();
        yield sequelize.sync({ alter: true }); // Adjust this according to your needs
        console.log('Connection has been established successfully.');
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
    }
});
exports.connection = connection;
