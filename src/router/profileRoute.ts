import express, { Request, Response, NextFunction, RequestHandler } from "express";
import { index, update } from "../controller/profileController";
import authMiddleware from "../authenticate/authenticate";
import { User } from "../postgres/model/userModel";

// Define a custom interface for the Request object to include `user`
interface AuthenticatedRequest extends Request {
  user?: User; // Replace with your specific user type
}

// Explicitly type your middleware and route handlers
const typedAuthMiddleware: RequestHandler = authMiddleware as unknown as RequestHandler;
const typedIndex: RequestHandler = index as unknown as RequestHandler;
const typedUpdate: RequestHandler = update as unknown as RequestHandler;

const profileRouter = express.Router();

profileRouter.get("/", typedAuthMiddleware, typedIndex);
profileRouter.post("/:id", typedAuthMiddleware, typedUpdate);

export default profileRouter;
