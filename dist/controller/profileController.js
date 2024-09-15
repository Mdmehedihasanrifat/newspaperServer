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
exports.update = exports.index = void 0;
const postgres_1 = require("../postgres/postgres");
const helper_1 = require("../utils/helper");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let user = req.user;
    const foundUser = yield postgres_1.userModel.findOne({
        where: { email: user.email },
    });
    if (!foundUser) {
        return res.status(404).json({ status: 404, message: 'User not found' });
    }
    return res.json({ status: 200, user: foundUser });
});
exports.index = index;
const ensureDirectoryExistence = (filePath) => {
    const dir = path_1.default.dirname(filePath);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
};
// Update your update function
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = req.user;
    if (!req.files || !req.files.profile) {
        return res.status(400).json({ messages: 'Profile image required' });
    }
    const profile = req.files.profile;
    try {
        const validationMessages = yield (0, helper_1.imageValidator)(profile.size, profile.mimetype);
        if (validationMessages !== null) {
            return res.status(400).json({ messages: validationMessages });
        }
        const imgExt = profile.name.split('.').pop();
        if (!imgExt) {
            return res.status(400).json({ messages: 'Invalid file extension' });
        }
        const imageName = `${(0, helper_1.generateRandom)()}.${imgExt}`;
        const uploadPath = path_1.default.join(process.cwd(), 'public', 'images', imageName);
        // Ensure the directory exists
        ensureDirectoryExistence(uploadPath);
        yield new Promise((resolve, reject) => {
            profile.mv(uploadPath, (err) => {
                if (err) {
                    console.error('Error during file upload:', err);
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
        const [updated] = yield postgres_1.userModel.update({ profile: imageName }, { where: { id: id } });
        if (updated === 0) {
            console.error('User not found or not updated');
            return res.status(404).json({ messages: 'User not found' });
        }
        return res.json({
            name: profile.name,
            size: profile.size,
            mime: profile.mimetype
        });
    }
    catch (err) {
        console.error('Error in update function:', err);
        return res.status(500).json({ messages: 'Error uploading file' });
    }
});
exports.update = update;
