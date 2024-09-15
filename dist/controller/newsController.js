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
const newsdataValidation_1 = require("../validation/newsdataValidation");
const helper_1 = require("../utils/helper");
// Get all news articles
const newsIndex = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Set default pagination values
    let page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = Math.max(Math.min(parseInt(req.query.limit, 10) || 10, 100), 1);
    // Calculate pagination offset
    const skip = (page - 1) * limit;
    try {
        // Fetch news with pagination, user, and categories
        const news = yield postgres_1.newsModel.findAll({
            limit,
            offset: skip,
            include: [
                {
                    model: postgres_1.userModel,
                    as: "user",
                    attributes: ["id", "firstName", "profile"],
                },
                {
                    model: postgres_1.categoryModel,
                    as: "categories", // Assuming you have a relation defined with this alias
                    attributes: ["id", "name"],
                    through: { attributes: [] } // Hide the junction table data if it's a many-to-many relationship
                },
            ],
            attributes: ["id", "title", "description", "image", "createdAt"],
        });
        // Transform news data
        const newsTransformed = news.map(item => (0, transform_1.newsTransform)(item));
        // Count total news items
        const totalNews = yield postgres_1.newsModel.count();
        const totalPages = Math.ceil(totalNews / limit);
        // Return paginated news with metadata and categories
        return res.json({
            status: 200,
            news: newsTransformed,
            metadata: {
                totalPages,
                currentPage: page,
                limit,
            },
        });
    }
    catch (error) {
        // Log and return error response
        console.error('Error retrieving news:', error);
        return res.status(500).json({
            status: 500,
            message: 'Error retrieving news articles',
        });
    }
});
exports.newsIndex = newsIndex;
const newsStore = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user; // Assuming `req.user` is populated by your auth middleware
        let body = req.body;
        // Attach userId to the request body
        body.userId = user.id;
        let categoryIds = [];
        if (body.categoryIds) {
            categoryIds = body.categoryIds.split(',').map((id) => parseInt(id));
        }
        // Validate the request body using Zod
        body.categoryIds = categoryIds;
        const validator = newsdataValidation_1.newsValidationSchema.safeParse(body);
        if (!validator.success) {
            return res.status(400).json({ message: "Validation failed", errors: validator.error.format() });
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
        const imgExt = image.name.split('.').pop(); // Get the file extension
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
            include: [{ model: postgres_1.categoryModel, as: 'categories' }]
        });
        // Associate categories with the news entry
        if (categoryIds.length > 0) {
            yield newsWithAssociations.addCategories(categoryIds);
        }
        // Respond with the created news entry
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
        const { id } = req.params; // Get the `id` from the request params
        // Fetch news with the specific ID and include user information
        const news = yield postgres_1.newsModel.findOne({
            where: { id: id },
            include: [
                {
                    model: postgres_1.userModel,
                    as: 'user', // Match the alias from the association
                    attributes: ['id', 'firstName', 'email'] // Only select these user attributes
                }
            ]
        });
        if (!news) {
            // If no news article is found, return a 404 status
            return res.status(404).json({ message: 'News article not found' });
        }
        // Transform the news using the `newsTransform` function
        const transformedNews = (0, transform_1.newsTransform)(news);
        // Return the transformed news data in the response
        return res.json(transformedNews);
    }
    catch (error) {
        // If there is an error, return a 500 status with the error message
        return res.status(500).json({ message: 'Error retrieving news article', error });
    }
});
exports.newsShow = newsShow;
// Update a specific news article by ID
const newsUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const user = req.user;
        // Find the news by ID
        const news = yield postgres_1.newsModel.findOne({
            where: { id: id }
        });
        if (!news) {
            return res.status(404).json({ status: 404, message: "News not found" });
        }
        // Check if the logged-in user is authorized to update the news (only the owner can update)
        if (user.id !== news.userId) {
            return res.status(403).json({ status: 403, message: "Unauthorized" });
        }
        // Validate the request body using Zod
        const body = req.body;
        if (body.title == null) {
            body.title = news.title;
        }
        if (body.description == null) {
            body.description = news.description;
        }
        //   if(body.categoryId==null){body.categoryId=news.categoryId}
        if (body.image == null) {
            body.image = news.image;
        }
        body.userId = news.userId;
        console.log(body);
        const payload = newsdataValidation_1.newsValidationSchema.parse(req.body);
        // Handle image upload if an image is provided
        const image = (_a = req === null || req === void 0 ? void 0 : req.files) === null || _a === void 0 ? void 0 : _a.image;
        if (image) {
            const message = (0, helper_1.imageValidator)(image.size, image.mimetype);
            if (message !== null) {
                return res.status(400).json({ status: 400, message: message });
            }
            const imgExt = image.name.split(".").pop(); // Extract the file extension
            const imageName = (0, helper_1.generateRandom)() + "." + imgExt;
            const uploadPath = process.cwd() + "/public/news/" + imageName;
            // Move the uploaded image to the specified path
            image.mv(uploadPath, (err) => {
                if (err) {
                    throw err;
                }
            });
            // Remove the old image if it exists
            if (news.image) {
                (0, helper_1.removeImage)(news.image);
            }
            // Add image name to payload
            payload.image = imageName;
        }
        // Update the news entry
        yield postgres_1.newsModel.update(payload, {
            where: { id: id }
        });
        return res.status(200).json({ status: 200, message: "News updated successfully" });
    }
    catch (err) {
        if (err instanceof Error) {
            return res.status(400).json({ status: 400, message: err.message });
        }
        else if (err instanceof Error) {
            return res.status(500).json({ status: 500, message: err.message });
        }
        return res.status(500).json({ status: 500, message: "Unknown error occurred" });
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
            where: { id: id }
        });
        // Check if the news exists
        if (!news) {
            return res.status(404).json({ status: 404, message: "News not found" });
        }
        // Check if the logged-in user is authorized to delete the news (only the owner can delete)
        if (user.id !== news.userId) {
            return res.status(403).json({ status: 403, message: "Unauthorized" });
        }
        // Optionally remove the associated image from the server
        if (news.image) {
            (0, helper_1.removeImage)(news.image); // Assuming you have a function to remove images
        }
        // Delete the news entry
        yield postgres_1.newsModel.destroy({
            where: { id: id }
        });
        return res.status(200).json({ status: 200, message: "News deleted successfully" });
    }
    catch (err) {
        // Type narrowing to handle 'unknown' type
        if (err instanceof Error) {
            console.error("Error:", err.message);
            return res.status(500).json({
                status: 500,
                message: err.message || "An error occurred"
            });
        }
        // Fallback for cases where the error isn't an instance of Error
        return res.status(500).json({
            status: 500,
            message: "An unknown error occurred"
        });
    }
});
exports.newsDestroy = newsDestroy;
