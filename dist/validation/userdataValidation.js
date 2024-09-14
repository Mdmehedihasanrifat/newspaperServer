"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchemaValidation = exports.userSchemaValidation = void 0;
const zod_1 = require("zod");
// User registration validation schema with Zod
exports.userSchemaValidation = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name must have at least 1 character").max(100, "First name must not exceed 100 characters"),
    lastName: zod_1.z.string().min(1, "Last name must have at least 1 character").max(100, "Last name must not exceed 100 characters"),
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(8, "Password must have at least 8 characters").max(150, "Password must not exceed 150 characters"),
});
// User login validation schema with Zod
exports.loginSchemaValidation = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(8, "Password must have at least 8 characters").max(150, "Password must not exceed 150 characters"),
});
