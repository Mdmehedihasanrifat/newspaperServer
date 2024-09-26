"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticate_1 = __importDefault(require("../authenticate/authenticate"));
const newsController_1 = require("../controller/newsController");
const typedAuthMiddleware = authenticate_1.default;
const typedStore = newsController_1.newsStore;
const typedDestroy = newsController_1.newsDestroy;
const typedUpdate = newsController_1.newsUpdate;
// const typedSearch: RequestHandler = newsSearch as unknown as RequestHandler;
const newsRouter = express_1.default.Router();
// List all news
newsRouter.get("/", newsController_1.newsIndex);
// Create a new news article (auth required)
newsRouter.post("/", typedAuthMiddleware, typedStore);
// Get a specific news article by ID
newsRouter.get("/:id", newsController_1.newsShow);
// Update a specific news article by ID (auth required)
newsRouter.put("/:id", authenticate_1.default, typedUpdate);
// Delete a specific news article by ID (auth required)
newsRouter.delete("/:id", authenticate_1.default, typedDestroy);
// newsRouter.get("/news/search",typedSearch);/
newsRouter.get('/:id/recommend', newsController_1.recommendNews);
exports.default = newsRouter;
