"use strict";
// routes/commentRouter.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const commentController_1 = require("../controller/commentController");
const authenticate_1 = __importDefault(require("../authenticate/authenticate"));
const commentRouter = express_1.default.Router();
const typedAuthMiddleware = authenticate_1.default;
const typedCommentStore = commentController_1.createComment;
const typedCommnetlist = commentController_1.listComments;
const typedCommentUpdate = commentController_1.updateComment;
const typedCommentDelete = commentController_1.deleteComment;
// Create a new comment (auth required)
commentRouter.post('/:id/comments', typedAuthMiddleware, typedCommentStore);
// List comments for a specific news item
commentRouter.get('/:id/comments', typedCommnetlist);
// Update a comment (auth required)
commentRouter.put('/:newsId/comments/:id', typedAuthMiddleware, typedCommentUpdate);
// Delete a comment (auth required)
commentRouter.delete('/:newsId/comments/:id', typedAuthMiddleware, typedCommentDelete);
exports.default = commentRouter;
