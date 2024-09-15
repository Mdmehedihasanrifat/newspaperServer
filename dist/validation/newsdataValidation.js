"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsValidationSchema = void 0;
const zod_1 = require("zod");
exports.newsValidationSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(255),
    description: zod_1.z.string(),
    image: zod_1.z.string().optional(), // Make the image optional
    categoryIds: zod_1.z.array(zod_1.z.number()).optional(),
    userId: zod_1.z.number(),
});
