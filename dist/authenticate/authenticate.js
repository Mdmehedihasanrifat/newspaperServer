"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const postgres_1 = require("../postgres/postgres");
// Utility function to verify the JWT token and return a promise
const verifyToken = (token, secret) => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, secret, (err, decoded) => {
            if (err) {
                return reject(err);
            }
            resolve(decoded);
        });
    });
};
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader === 'null') {
        return res.status(401).json({ status: 401, message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ status: 500, message: "Internal server error" });
    }
    try {
        const decoded = yield verifyToken(token, process.env.JWT_SECRET);
        if (typeof decoded === 'object' && 'email' in decoded) {
            const user = yield postgres_1.userModel.findOne({
                where: { email: decoded.email },
            });
            if (!user) {
                return res.status(401).json({ status: 401, message: "Unauthorized" });
            }
            req.user = user;
            next();
        }
        else {
            return res.status(401).json({ status: 401, message: "Unauthorized" });
        }
    }
    catch (err) {
        return res.status(401).json({ status: 401, message: "Unauthorized" });
    }
});
exports.default = authMiddleware;
