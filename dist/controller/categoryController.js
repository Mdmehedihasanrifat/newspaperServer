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
exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getAllCategories = exports.createCategory = void 0;
const postgres_1 = require("../postgres/postgres");
// Create a new category
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.body;
        const category = yield postgres_1.categoryModel.create({ name });
        return res.status(201).json(category);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.createCategory = createCategory;
// Get all categories
const getAllCategories = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield postgres_1.categoryModel.findAll();
        return res.json(categories);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.getAllCategories = getAllCategories;
// Get a specific category by ID
const getCategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield postgres_1.categoryModel.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.status(200).json(category);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.getCategoryById = getCategoryById;
// Update a category
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.body;
        const category = yield postgres_1.categoryModel.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        category.name = name;
        yield category.save();
        return res.status(200).json(category);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.updateCategory = updateCategory;
// Delete a category
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield postgres_1.categoryModel.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        yield category.destroy();
        return res.status(204).send();
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
});
exports.deleteCategory = deleteCategory;
