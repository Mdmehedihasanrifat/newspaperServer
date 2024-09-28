import express, { Request, Response, NextFunction, RequestHandler } from "express";
import  authMiddleware from '../authenticate/authenticate';
import { newsIndex, newsStore, newsShow, newsUpdate, newsDestroy,  recommendNews, } from '../controller/newsController';
import { User } from '../postgres/model/userModel';
import { trackVisitor } from "../visitor/visitorTracker";
// import redisCache from "../config/redis.config";

interface AuthenticatedRequest extends Request {
    user: User; // Replace with your specific user type
  }
  const typedAuthMiddleware: RequestHandler = authMiddleware as unknown as RequestHandler;
  const typedStore: RequestHandler = newsStore as unknown as RequestHandler;
  const typedDestroy: RequestHandler = newsDestroy as unknown as RequestHandler;
  const typedUpdate: RequestHandler = newsUpdate as unknown as RequestHandler;
  // const typedSearch: RequestHandler = newsSearch as unknown as RequestHandler;
const newsRouter = express.Router();

// List all news
newsRouter.get("/",newsIndex);

// Create a new news article (auth required)
newsRouter.post("/", typedAuthMiddleware, typedStore);

// Get a specific news article by ID
newsRouter.get("/:id",trackVisitor, newsShow);

// Update a specific news article by ID (auth required)
newsRouter.put("/:id", authMiddleware, typedUpdate);

// Delete a specific news article by ID (auth required)
newsRouter.delete("/:id", authMiddleware, typedDestroy);
// newsRouter.get("/news/search",typedSearch);/
newsRouter.get('/:id/recommend', recommendNews);


export default newsRouter;
