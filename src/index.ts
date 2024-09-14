import express from "express";
import dotenv from "dotenv";
import {connection}from "./postgres/postgres";
import mainRouter from "./router/mainRoute";
import fileUpload from "express-fileupload";
import cors from "cors";

dotenv.config();
const port=process.env.PORT


const app=express();
app.use(fileUpload());
app.use(cors())
app.use(express.json());

app.use("/api",mainRouter);



app.listen(port,()=>{
    console.log(port)
})
connection();


