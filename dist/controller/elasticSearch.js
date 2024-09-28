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
exports.getRecommendedNews = exports.indexNewsInElasticsearch = void 0;
exports.testElasticConnection = testElasticConnection;
const elasticSearch_1 = require("../config/elasticSearch");
const indexNewsInElasticsearch = (news) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        yield elasticSearch_1.esClient.index({
            index: 'news', // Index name
            id: news.id, // Document ID
            body: {
                title: news.headline,
                description: news.details,
                authorName: news.author.name,
                image: news.image,
                createdAt: news.createdAt,
                author: news.author ? {
                    id: news.author.id,
                    name: news.author.name,
                } : null,
                categories: (_a = news.categoryIds) === null || _a === void 0 ? void 0 : _a.map((category) => ({
                    id: category.id,
                    name: category.name,
                })),
            },
        });
    }
    catch (error) {
        console.error('Error indexing news article:', error);
    }
});
exports.indexNewsInElasticsearch = indexNewsInElasticsearch;
const getRecommendedNews = (newsId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield elasticSearch_1.esClient.search({
            index: 'news',
            body: {
                query: {
                    more_like_this: {
                        fields: ['title', 'description'],
                        like: [{ _id: newsId }],
                        min_term_freq: 1,
                        max_query_terms: 12,
                    },
                },
            },
        });
        return result.hits.hits;
    }
    catch (error) {
        console.error('Error fetching recommended news:', error);
        return [];
    }
});
exports.getRecommendedNews = getRecommendedNews;
function testElasticConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield elasticSearch_1.esClient.ping();
            console.log('Elasticsearch connection successful:', response);
        }
        catch (error) {
            console.error('Elasticsearch connection failed:', error);
        }
    });
}
