// routes/commentRouter.ts

import express, { RequestHandler } from 'express';
import { createComment, deleteComment, listComments, updateComment } from '../controller/commentController';
import authMiddleware from '../authenticate/authenticate'; 

const commentRouter = express.Router();




  const typedAuthMiddleware: RequestHandler = authMiddleware as unknown as RequestHandler;
  const typedCommentStore: RequestHandler = createComment as unknown as RequestHandler;
  const typedCommnetlist: RequestHandler = listComments as unknown as RequestHandler;
  const typedCommentUpdate: RequestHandler = updateComment as unknown as RequestHandler;
  const typedCommentDelete: RequestHandler = deleteComment as unknown as RequestHandler;

  // Create a new comment (auth required)
commentRouter.post('/:id/comments', typedAuthMiddleware, typedCommentStore);

// List comments for a specific news item
commentRouter.get('/:id/comments', typedCommnetlist);

// Update a comment (auth required)
commentRouter.put('/:newsId/comments/:id', typedAuthMiddleware, typedCommentUpdate);

// Delete a comment (auth required)
commentRouter.delete('/:newsId/comments/:id', typedAuthMiddleware, typedCommentDelete);

export default commentRouter;
