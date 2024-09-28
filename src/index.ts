import express from "express";
import dotenv from "dotenv";
import { connection } from "./postgres/postgres";
import mainRouter from "./router/mainRoute";
import fileUpload from "express-fileupload";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

dotenv.config();
const port = process.env.PORT;

const app = express();

// Middleware
app.use(fileUpload());
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", mainRouter);

// Create an HTTP server and bind it with the Express app
const server = http.createServer(app);

// Initialize Socket.IO and bind it to the HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for testing. You can restrict it to specific origins.
    methods: ["GET", "POST"],
  },
});

// Socket.IO logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
  
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
  
  // Function to emit article indexing completion
  export const emitNewsIndexed = (news: any) => {
    io.emit('news', news);
  };
   export const emitNewsDeleted=(id:any)=>{
    io.emit('newsDeleted', { newsId: id });
   }
  
//
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  connection();
});
