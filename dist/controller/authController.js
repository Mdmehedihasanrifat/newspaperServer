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
exports.login = exports.register = void 0;
const userdataValidation_1 = require("../validation/userdataValidation");
const bcrypt_1 = __importDefault(require("bcrypt"));
const postgres_1 = require("../postgres/postgres");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const salt = bcrypt_1.default.genSaltSync(10);
        const body = req.body;
        // Zod validation
        const result = userdataValidation_1.userSchemaValidation.safeParse(body);
        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        const payload = result.data;
        // Check if user already exists
        const findUser = yield postgres_1.userModel.findOne({
            where: {
                email: payload.email,
            },
        });
        if (findUser) {
            return res.status(400).json({ messages: "Email already exists" });
        }
        // Hash password and create user
        payload.password = bcrypt_1.default.hashSync(payload.password, salt);
        const user = yield postgres_1.userModel.create(payload);
        return res.status(200).json({ status: 200, messages: "Successfully created user" });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        // Zod validation
        const result = userdataValidation_1.loginSchemaValidation.safeParse(body);
        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        const payload = result.data;
        // Find the user in the database
        const findUser = yield postgres_1.userModel.findOne({
            where: { email: payload.email },
        });
        if (findUser) {
            // Compare the password
            if (bcrypt_1.default.compareSync(payload.password, findUser.password)) {
                // Generate JWT token
                const token = jsonwebtoken_1.default.sign({ email: payload.email }, // It's safer to include minimal info in the token payload
                process.env.JWT_SECRET, { expiresIn: '30d' });
                return res.json({
                    status: 200,
                    messages: "Login successfully",
                    access_token: `Bearer ${token}`,
                    user: {
                        email: findUser.email,
                        name: findUser.firstName, // Assuming `firstName` is a field in your database
                    },
                });
            }
            else {
                return res.status(400).json({ messages: "Invalid password" });
            }
        }
        else {
            return res.status(400).json({ messages: "No user found" });
        }
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.login = login;
