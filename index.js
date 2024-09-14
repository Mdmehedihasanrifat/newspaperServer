import express from "express";
import cors from "cors"
import dotenv from "dotenv";
import { connection } from "./postgres/postgres.js";
import authRouter from "./router/authRouter.js";
import profileRouter from "./router/profileRouter.js";

dotenv.config()
const app=express();
const PORT=process.env.PORT||3000;


app.use(cors());
app.use(express.json());

app.use("/api/auth",authRouter)
app.use("/api",profileRouter)
app.listen(PORT,(req,res)=>{
    console.log("hello"+PORT)
})
connection();
