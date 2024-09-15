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
exports.newsDestroy = exports.newsUpdate = exports.newsShow = exports.newsStore = exports.newsIndex = void 0;
const postgres_1 = require("../postgres/postgres"); // Adjust the import path to your actual model
const transform_1 = require("../transform/transform");
// Get all news articles
const newsIndex = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;
    if (page < 1)
        page = 1;
    if (limit < 1 || limit > 100)
        limit = 10;
    const skip = (page - 1) * limit;
    try {
        const news = yield postgres_1.newsModel.findAll({
            limit: limit,
            offset: skip,
            include: [
                {
                    model: postgres_1.userModel,
                    as: "user",
                    attributes: ["id", "firstName", "profile"],
                },
            ],
            attributes: ["id", "title", "description", "image", "createdAt"],
        });
        const newsTransformed = news.map((item) => (0, transform_1.newsTransform)(item));
        const totalNews = yield postgres_1.newsModel.count();
        const totalPages = Math.ceil(totalNews / limit);
        return res.json({
            status: 200,
            news: newsTransformed,
            metadata: {
                totalPages: totalPages,
                currentPage: page,
                limit: limit,
            },
        });
    }
    catch (error) {
        console.error('Error retrieving news:', error);
        return res.status(500).json({
            status: 500,
            message: 'Error retrieving news articles',
        });
    }
});
exports.newsIndex = newsIndex;
// Create a new news article
const newsStore = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, image, categoryId, userId } = req.body;
        const newNews = yield postgres_1.newsModel.create({ title, description, image, categoryId, userId });
        res.status(201).json(newNews);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating news article', error });
    }
});
exports.newsStore = newsStore;
// Get a specific news article by ID
const newsShow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const news = yield postgres_1.newsModel.findByPk(id);
        if (news) {
            res.json(news);
        }
        else {
            res.status(404).json({ message: 'News article not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving news article', error });
    }
});
exports.newsShow = newsShow;
// Update a specific news article by ID
const newsUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, description, image, categoryId, userId } = req.body;
        const [updated] = yield postgres_1.newsModel.update({ title, description, image, categoryId, userId }, {
            where: { id }
        });
        if (updated) {
            const updatedNews = yield postgres_1.newsModel.findByPk(id);
            res.json(updatedNews);
        }
        else {
            res.status(404).json({ message: 'News article not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating news article', error });
    }
});
exports.newsUpdate = newsUpdate;
// Delete a specific news article by ID
const newsDestroy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deleted = yield postgres_1.newsModel.destroy({
            where: { id }
        });
        if (deleted) {
            res.status(204).json({ message: 'News article deleted' });
        }
        else {
            res.status(404).json({ message: 'News article not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting news article', error });
    }
});
exports.newsDestroy = newsDestroy;
