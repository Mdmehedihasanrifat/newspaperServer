"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profileController_1 = require("../controller/profileController");
const authenticate_1 = __importDefault(require("../authenticate/authenticate"));
const profileRouter = express_1.default.Router();
profileRouter.get('/', authenticate_1.default, profileController_1.index);
profileRouter.put('/:id', authenticate_1.default, profileController_1.update);
exports.default = profileRouter;
