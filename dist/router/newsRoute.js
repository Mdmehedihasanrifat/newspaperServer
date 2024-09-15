"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticate_1 = __importDefault(require("../authenticate/authenticate"));
const newsController_1 = require("../controller/newsController");
const newsRouter = express_1.default.Router();
// List all news
newsRouter.get("/", newsController_1.newsIndex);
// Create a new news article (auth required)
newsRouter.post("/", authenticate_1.default, newsController_1.newsStore);
// Get a specific news article by ID
newsRouter.get("/:id", newsController_1.newsShow);
// Update a specific news article by ID (auth required)
newsRouter.put("/:id", authenticate_1.default, newsController_1.newsUpdate);
// Delete a specific news article by ID (auth required)
newsRouter.delete("/:id", authenticate_1.default, newsController_1.newsDestroy);
exports.default = newsRouter;
