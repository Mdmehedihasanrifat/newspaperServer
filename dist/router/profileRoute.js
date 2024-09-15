"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profileController_1 = require("../controller/profileController");
const authenticate_1 = __importDefault(require("../authenticate/authenticate"));
// Explicitly type your middleware and route handlers
const typedAuthMiddleware = authenticate_1.default;
const typedIndex = profileController_1.index;
const typedUpdate = profileController_1.update;
const profileRouter = express_1.default.Router();
profileRouter.get("/", typedAuthMiddleware, typedIndex);
profileRouter.post("/:id", typedAuthMiddleware, typedUpdate);
exports.default = profileRouter;
