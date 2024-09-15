"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsTransform = void 0;
const helper_1 = require("../utils/helper");
const newsTransform = (news) => {
    var _a, _b, _c;
    return {
        id: news.id,
        headline: news.title,
        details: news.description,
        image: (0, helper_1.getImageUrl)(news.image),
        author: {
            id: (_a = news.user) === null || _a === void 0 ? void 0 : _a.id, // Use optional chaining to avoid errors if user is undefined
            name: (_b = news.user) === null || _b === void 0 ? void 0 : _b.firstName,
            profile: ((_c = news.user) === null || _c === void 0 ? void 0 : _c.profile)
                ? (0, helper_1.getProfileImageUrl)(news.user.profile)
                : "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.vecteezy.com%2Ffree-vector%2Fprofile-avatar&psig=AOvVaw1tqVhpAdxSIWMi59j-165o&ust=1726065127132000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCOCT7ufLuIgDFQAAAAAdAAAAABAE"
        }
    };
};
exports.newsTransform = newsTransform;
