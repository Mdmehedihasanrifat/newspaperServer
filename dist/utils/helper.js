"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeImage = exports.getProfileImageUrl = exports.getImageUrl = exports.generateRandom = exports.bytesToMb = exports.imageValidator = void 0;
const filesystem_1 = require("../config/filesystem");
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const imageValidator = (size, mime) => {
    if ((0, exports.bytesToMb)(size) > 2) {
        return "Image must be less than 2MB";
    }
    else if (!filesystem_1.supportedImageMimes.includes(mime)) {
        return "Image type should be img, jpg, png, etc.";
    }
    return null;
};
exports.imageValidator = imageValidator;
const bytesToMb = (bytes) => {
    return bytes / (1024 * 1024);
};
exports.bytesToMb = bytesToMb;
const generateRandom = () => {
    return (0, uuid_1.v4)();
};
exports.generateRandom = generateRandom;
// Ensure you have the correct type for imgName
const getImageUrl = (imgName) => {
    // Check if imgName is a valid URL (i.e., starts with 'http://' or 'https://')
    if (imgName.startsWith('http://') || imgName.startsWith('https://')) {
        return imgName; // Return the absolute URL directly
    }
    // Handle relative URL by combining it with the base URL
    const baseUrl = process.env.APP_URL || 'http://localhost:3000/';
    return `${baseUrl}news/${imgName}`;
};
exports.getImageUrl = getImageUrl;
const getProfileImageUrl = (imgName) => {
    return `${process.env.APP_URL}images/${imgName}`;
};
exports.getProfileImageUrl = getProfileImageUrl;
const removeImage = (imgName) => {
    const path = `${process.cwd()}/public/news/${imgName}`;
    if (fs_1.default.existsSync(path)) {
        fs_1.default.unlinkSync(path);
    }
};
exports.removeImage = removeImage;
