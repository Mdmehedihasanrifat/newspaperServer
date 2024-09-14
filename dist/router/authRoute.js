"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controller/authController");
const authRouter = express_1.default.Router();
authRouter.post("/auth/register", authController_1.register);
authRouter.post("/auth/login", authController_1.login);
exports.default = authRouter;
