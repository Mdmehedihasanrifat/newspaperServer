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
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.index = void 0;
const postgres_1 = require("../postgres/postgres");
const helper_1 = require("../utils/helper");
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let user = req.user;
    const foundUser = yield postgres_1.userModel.findOne({
        where: { email: user.email },
    });
    if (!foundUser) {
        return res.status(404).json({ status: 404, message: "User not found" });
    }
    // If foundUser exists, safely reassign it to the user variable
    user = foundUser;
    return res.json({ status: 200, user: user });
});
exports.index = index;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = req.user;
    // Check if files are uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ messages: "Profile image required" });
    }
    const profile = req.files.profile;
    const validationMessages = yield (0, helper_1.imageValidator)(profile === null || profile === void 0 ? void 0 : profile.size, profile.mimetype);
    if (validationMessages !== null) {
        return res.status(400).json({ messages: validationMessages });
    }
    const imgExt = profile.name.split(".")[1];
    const imageName = (0, helper_1.generateRandom)() + "." + imgExt;
    const uploadPath = process.cwd() + "/public/images" + imageName;
    profile.mv(uploadPath, (err) => {
        if (err)
            throw err;
    });
    yield postgres_1.userModel.update({ profile: imageName }, { where: { id: id } });
    return res.json({
        name: profile.name,
        size: profile.size,
        mime: profile.mimetype,
    });
});
exports.update = update;
