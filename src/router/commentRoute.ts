// routes/commentRouter.ts

import express, { RequestHandler } from 'express';
import { createComment, listComments } from '../controller/commentController';
import authMiddleware from '../authenticate/authenticate'; // Adjust import path as needed
import { User } from '../postgres/model/userModel';
const commentRouter = express.Router();




  const typedAuthMiddleware: RequestHandler = authMiddleware as unknown as RequestHandler;
  const typedCommentStore: RequestHandler = createComment as unknown as RequestHandler;
  const typedCommnetlist: RequestHandler = listComments as unknown as RequestHandler;
  // Create a new comment (auth required)
commentRouter.post('/:id/comments', typedAuthMiddleware, typedCommentStore);

// List comments for a specific news item
commentRouter.get('/:id/comments', typedCommnetlist);

export default commentRouter;
