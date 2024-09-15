"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controller/categoryController");
const authenticate_1 = __importDefault(require("../authenticate/authenticate"));
const categoryRouter = (0, express_1.Router)();
// Route to create a new category
categoryRouter.post('/', authenticate_1.default, categoryController_1.createCategory);
// Route to get all categories
categoryRouter.get('/', authenticate_1.default, categoryController_1.getAllCategories);
// Route to get a specific category by ID
categoryRouter.get('/:id', authenticate_1.default, categoryController_1.getCategoryById);
// Route to update a category by ID
categoryRouter.put('/:id', authenticate_1.default, categoryController_1.updateCategory);
// Route to delete a category by ID
categoryRouter.delete('/:id', authenticate_1.default, categoryController_1.deleteCategory);
exports.default = categoryRouter;
