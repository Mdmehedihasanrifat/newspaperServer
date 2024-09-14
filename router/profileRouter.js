import express from "express"
import { index,update } from "../controller/profileController.js";
import authMiddleware from "../middleware/authenticate.js";



const profileRouter=express.Router();
profileRouter.get("/profile",authMiddleware,index);
profileRouter.post("/profile/:id",authMiddleware,update);


export default profileRouter;