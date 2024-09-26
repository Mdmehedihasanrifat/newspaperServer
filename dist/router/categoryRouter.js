"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controller/categoryController");
const categoryRouter = (0, express_1.Router)();
// Route to create a new category
categoryRouter.post('/', categoryController_1.createCategory);
// Route to get all categories
categoryRouter.get('/', categoryController_1.getAllCategories);
// Route to get a specific category by ID
categoryRouter.get('/:id', categoryController_1.getCategoryById);
// Route to update a category by ID
categoryRouter.put('/:id', categoryController_1.updateCategory);
// Route to delete a category by ID
categoryRouter.delete('/:id', categoryController_1.deleteCategory);
exports.default = categoryRouter;
