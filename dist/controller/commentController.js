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
exports.deleteComment = exports.updateComment = exports.listComments = exports.createComment = void 0;
const postgres_1 = require("../postgres/postgres");
// Create a new comment
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id; // Get the ID of the authenticated user
        let { id } = req.params; // ID of the news to comment on
        const { comment } = req.body; // The comment text
        let newsId = parseInt(id);
        // Ensure the news item exists
        const news = yield postgres_1.newsModel.findByPk(newsId);
        if (!news) {
            return res.status(404).json({ status: 404, message: "News not found" });
        }
        // Create the comment
        const newComment = yield postgres_1.commentModel.create({
            userId,
            newsId,
            comment
        });
        return res.status(201).json({ status: 201, comment: newComment });
    }
    catch (err) {
        if (err instanceof Error) {
            return res.status(500).json({ status: 500, message: err.message });
        }
        return res.status(500).json({ status: 500, message: "Unknown error occurred" });
    }
});
exports.createComment = createComment;
// List comments for a specific news item
const listComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { id } = req.params;
        console.log(id);
        // Ensure the news item exists
        const news = yield postgres_1.newsModel.findByPk(id);
        if (!news) {
            return res.status(404).json({ status: 404, message: "News not found" });
        }
        // Get comments for the news item
        const comments = yield postgres_1.commentModel.findAll({
            where: { newsId: id } // Query by newsId, not by id
        });
        return res.status(200).json({ status: 200, comments });
    }
    catch (err) {
        if (err instanceof Error) {
            return res.status(500).json({ status: 500, message: err.message });
        }
        return res.status(500).json({ status: 500, message: "Unknown error occurred" });
    }
});
exports.listComments = listComments;
//Update comment
const updateComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id; // Get the ID of the authenticated user
        const { id } = req.params; // ID of the comment to update
        const { comment } = req.body; // Updated comment text
        // Ensure the comment exists
        const existingComment = yield postgres_1.commentModel.findByPk(id);
        if (!existingComment) {
            return res.status(404).json({ status: 404, message: "Comment not found" });
        }
        // Check if the user is authorized to update the comment
        if (existingComment.userId !== userId) {
            return res.status(403).json({ status: 403, message: "Unauthorized" });
        }
        // Update the comment
        yield existingComment.update({ comment });
        return res.status(200).json({ status: 200, comment: existingComment });
    }
    catch (err) {
        if (err instanceof Error) {
            return res.status(500).json({ status: 500, message: err.message });
        }
        return res.status(500).json({ status: 500, message: "Unknown error occurred" });
    }
});
exports.updateComment = updateComment;
// Delete a comment
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id; // Get the ID of the authenticated user
        const { id } = req.params; // ID of the comment to delete
        // Ensure the comment exists
        const existingComment = yield postgres_1.commentModel.findByPk(id);
        if (!existingComment) {
            return res.status(404).json({ status: 404, message: "Comment not found" });
        }
        // Check if the user is authorized to delete the comment
        if (existingComment.userId !== userId) {
            return res.status(403).json({ status: 403, message: "Unauthorized" });
        }
        // Delete the comment
        yield existingComment.destroy();
        return res.status(200).json({ status: 200, message: "Comment deleted successfully" });
    }
    catch (err) {
        if (err instanceof Error) {
            return res.status(500).json({ status: 500, message: err.message });
        }
        return res.status(500).json({ status: 500, message: "Unknown error occurred" });
    }
});
exports.deleteComment = deleteComment;
