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
exports.recommendNews = exports.newsDestroy = exports.newsUpdate = exports.newsShow = exports.newsStore = exports.newsIndex = void 0;
const postgres_1 = require("../postgres/postgres"); // Adjust the import path to your actual model
const transform_1 = require("../transform/transform");
const newsdataValidation_1 = require("../validation/newsdataValidation");
const helper_1 = require("../utils/helper");
// import redisCache from '../config/redis.config';
const elasticSearch_1 = require("../config/elasticSearch");
const elasticSearch_2 = require("./elasticSearch");
const newsIndex = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { query } = req;
    const userId = query === null || query === void 0 ? void 0 : query.userId;
    const search = query === null || query === void 0 ? void 0 : query.search;
    const categoryQuery = query === null || query === void 0 ? void 0 : query.category;
    const userIdNumber = userId ? parseInt(userId) : undefined;
    let page = Math.max(parseInt(query.page, 10) || 1, 1);
    let limit = Math.max(Math.min(parseInt(query.limit, 50) || 20, 100), 1);
    const skip = (page - 1) * limit;
    const whereClause = {};
    if (userIdNumber) {
        whereClause.userId = userIdNumber;
    }
    let categoryIdNumber;
    try {
        // Handle category filtering
        if (!isNaN(Number(categoryQuery))) {
            categoryIdNumber = parseInt(categoryQuery);
        }
        else if (categoryQuery) {
            const category = yield postgres_1.categoryModel.findOne({
                where: { name: categoryQuery },
                attributes: ["id"],
            });
            if (category) {
                categoryIdNumber = category.id;
            }
            else {
                return res.json({
                    news: [],
                    totalNews: 0,
                    currentPage: page,
                    limit: limit,
                });
            }
        }
        // If a search query is present, use Elasticsearch
        if (search) {
            const esResponse = yield elasticSearch_1.esClient.search({
                index: "news",
                body: {
                    query: {
                        bool: {
                            should: [
                                { match_phrase_prefix: { title: search } },
                                { match_phrase_prefix: { description: search } },
                            ],
                        },
                    },
                },
                from: skip,
                size: limit,
            });
            // Search by category
            const esNews = esResponse.hits.hits.map((hit) => ({
                id: hit._id,
                title: hit._source.title,
                description: hit._source.description,
                image: hit._source.image,
                createdAt: hit._source.createdAt,
            }));
            const totalNews = typeof esResponse.hits.total === "number"
                ? esResponse.hits.total
                : ((_a = esResponse.hits.total) === null || _a === void 0 ? void 0 : _a.value) || 0;
            return res.json({
                news: esNews,
                totalNews: totalNews,
                currentPage: page,
                limit: limit,
            });
        }
        else {
            // If no search query, fallback to Sequelize for filtering based on userId, category, etc.
            const news = yield postgres_1.newsModel.findAll({
                where: whereClause,
                attributes: ["id", "title", "description", "image", "createdAt"],
                include: [
                    {
                        model: postgres_1.userModel,
                        as: "user",
                        attributes: ["id", "firstName", "profile"],
                    },
                    {
                        model: postgres_1.categoryModel,
                        as: "categories",
                        attributes: ["id", "name"],
                        through: { attributes: [] },
                        where: categoryIdNumber ? { id: categoryIdNumber } : undefined,
                    },
                ],
                order: [["createdAt", "DESC"]],
                offset: skip,
                limit: limit,
            });
            const newsTransformed = news.map((item) => (0, transform_1.newsTransform)(item));
            const totalNews = yield postgres_1.newsModel.count({
                where: whereClause,
                include: categoryIdNumber
                    ? [
                        {
                            model: postgres_1.categoryModel,
                            as: "categories",
                            where: { id: categoryIdNumber },
                        },
                    ]
                    : [],
            });
            return res.json({
                news: newsTransformed,
                totalNews: totalNews,
                currentPage: page,
                limit: limit,
            });
        }
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.newsIndex = newsIndex;
// const delAsync = promisify(redisCache.del).bind(redisCache);
const newsStore = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user; // Assuming `req.user` is populated by your auth middleware
        let body = req.body;
        console.log(body);
        // Attach userId to the request body
        body.userId = user.id;
        let categoryIds = [];
        if (body.categoryIds) {
            categoryIds = body.categoryIds
                .split(",")
                .map((id) => parseInt(id));
        }
        // Validate the request body using Zod
        body.categoryIds = categoryIds;
        const validator = newsdataValidation_1.newsValidationSchema.safeParse(body);
        if (!validator.success) {
            return res
                .status(400)
                .json({
                message: "Validation failed",
                errors: validator.error.format(),
            });
        }
        const payload = validator.data;
        // Check if an image was uploaded
        if (!req.files || !req.files.image) {
            return res.status(400).json({ message: "Image required" });
        }
        const image = req.files.image;
        // Validate image size and type
        const messages = (0, helper_1.imageValidator)(image.size, image.mimetype);
        if (messages) {
            return res.status(400).json({ message: messages });
        }
        // Handle the file upload
        const imgExt = image.name.split(".").pop(); // Get the file extension
        const imageName = (0, helper_1.generateRandom)() + "." + imgExt; // Generate a random image name
        const uploadPath = process.cwd() + "/public/news/" + imageName;
        // Move the uploaded image to the specified path
        yield image.mv(uploadPath); // Use the async/await pattern for image move
        // Add the image name and user ID to the payload
        payload.image = imageName;
        payload.userId = user.id;
        // Create the news entry in the database
        const createdNews = yield postgres_1.newsModel.create(payload);
        const newsWithAssociations = yield createdNews.reload({
            include: [{ model: postgres_1.categoryModel, as: "categories" }],
        });
        // Associate categories with the news entry
        if (categoryIds.length > 0) {
            yield newsWithAssociations.addCategories(categoryIds);
        }
        console.log(payload);
        return res.json(newsWithAssociations);
    }
    catch (err) {
        // Catch and handle any errors
        console.error("Error:", err);
        return res.status(400).json({
            status: 400,
            message: err.message || "An error occurred",
        });
    }
});
exports.newsStore = newsStore;
// Get a specific news article by ID
const newsShow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const news = yield postgres_1.newsModel.findOne({
            where: { id: id },
            include: [
                {
                    model: postgres_1.userModel,
                    as: "user",
                    attributes: ["id", "firstName", "email"],
                },
                {
                    model: postgres_1.categoryModel,
                    as: "categories",
                    attributes: ["id", "name"],
                    through: { attributes: [] },
                },
            ],
        });
        if (!news) {
            return res.json({ message: "News article not found" });
        }
        const transformedNews = (0, transform_1.newsTransform)(news);
        (0, elasticSearch_2.indexNewsInElasticsearch)(transformedNews);
        return res.json(transformedNews);
    }
    catch (error) {
        console.error("Error retrieving news article:", error);
        return res
            .status(500)
            .json({ message: "Error retrieving news article", error });
    }
});
exports.newsShow = newsShow;
const newsUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const user = req.user;
        // Find the news by ID
        const news = yield postgres_1.newsModel.findOne({ where: { id } });
        if (!news) {
            return res.status(404).json({ status: 404, message: "News not found" });
        }
        // Check if the logged-in user is authorized to update the news
        if (user.id !== news.userId) {
            return res.status(403).json({ status: 403, message: "Unauthorized" });
        }
        let body = {
            title: req.body.title || news.title,
            description: req.body.description || news.description,
            image: news.image, // Use existing image by default
            categoryIds: req.body.categoryIds || news.categoryIds,
            userId: news.userId, // Keep the existing userId
        };
        let categoryIds = [];
        if (body.categoryIds) {
            categoryIds = body.categoryIds
                .split(",")
                .map((id) => parseInt(id));
        }
        // Validate the request body using Zod
        body.categoryIds = categoryIds;
        const validator = newsdataValidation_1.newsValidationSchema.safeParse(body);
        if (!validator.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: validator.error.format(),
            });
        }
        const payload = validator.data;
        // Handle image upload if an image is provided
        const image = (_a = req.files) === null || _a === void 0 ? void 0 : _a.image;
        if (image) {
            // Validate image size and type
            const message = (0, helper_1.imageValidator)(image.size, image.mimetype);
            if (message) {
                return res.status(400).json({ message });
            }
            // Handle file upload
            const imgExt = image.name.split(".").pop();
            const imageName = (0, helper_1.generateRandom)() + "." + imgExt;
            const uploadPath = process.cwd() + "/public/news/" + imageName;
            // Move the uploaded image to the specified path
            yield image.mv(uploadPath);
            // Remove the old image if it exists
            if (news.image) {
                (0, helper_1.removeImage)(news.image);
            }
            // Update the image name in the payload
            payload.image = imageName;
        }
        // Update the news entry in the database
        yield postgres_1.newsModel.update(payload, { where: { id } });
        // Associate categories with the news entry if category IDs are provided
        if (categoryIds.length > 0) {
            yield news.setCategories(categoryIds);
        }
        (0, elasticSearch_2.indexNewsInElasticsearch)(payload);
        return res.json({ message: "News updated successfully" });
    }
    catch (err) {
        console.error("Error:", err);
        return res.json({
            message: err.message || "An error occurred",
        });
    }
});
exports.newsUpdate = newsUpdate;
// Delete a specific news article by ID
const newsDestroy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { user } = req;
        // Find the news entry by ID
        const news = yield postgres_1.newsModel.findOne({
            where: { id: id },
        });
        //  await esClient.delete
        //  ({
        //    index: 'news',
        //  id: id,
        // });
        // Check if the news exists
        if (!news) {
            return res.status(404).json({ status: 404, message: "News not found" });
        }
        // Check if the logged-in user is authorized to delete the news (only the owner can delete)
        if (user.id !== news.userId) {
            return res.status(403).json({ status: 403, message: "Unauthorized" });
        }
        // Remove the associated image from the server, if it exists
        if (news.image) {
            try {
                (0, helper_1.removeImage)(news.image); // Assuming you have a function to remove images
            }
            catch (err) {
                console.error("Error removing image:", err);
            }
        }
        // Delete the news entry
        yield postgres_1.newsModel.destroy({
            where: { id: id },
        });
        // Log successful deletion
        console.log(`News article with ID ${id} deleted by user ${user.id}`);
        return res
            .status(200)
            .json({ status: 200, message: "News deleted successfully" });
    }
    catch (err) {
        // Type narrowing to handle 'unknown' type
        if (err instanceof Error) {
            console.error("Error:", err.message);
            return res.status(500).json({
                status: 500,
                message: err.message || "An error occurred",
            });
        }
        // Fallback for cases where the error isn't an instance of Error
        return res.status(500).json({
            status: 500,
            message: "An unknown error occurred",
        });
    }
});
exports.newsDestroy = newsDestroy;
const recommendNews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const recommendations = yield (0, elasticSearch_2.getRecommendedNews)(id);
        // Transform the recommendations as needed (optional)
        const transformedRecommendations = recommendations.map((rec) => (0, transform_1.newsTransform)(rec._source));
        return res.json({
            recommendations: transformedRecommendations,
        });
    }
    catch (error) {
        console.error('Error recommending news:', error);
        return res.status(500).json({ message: 'Error recommending news' });
    }
});
exports.recommendNews = recommendNews;
