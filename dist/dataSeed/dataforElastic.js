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
const elasticSearch_1 = require("../config/elasticSearch");
const postgres_1 = require("../postgres/postgres");
const BATCH_SIZE = 1000;
const INDEX_NAME = 'news';
function createIndex() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const indexExists = yield elasticSearch_1.esClient.indices.exists({ index: INDEX_NAME });
            if (!indexExists) {
                yield elasticSearch_1.esClient.indices.create({
                    index: INDEX_NAME,
                    body: {
                        mappings: {
                            properties: {
                                id: { type: 'integer' },
                                headline: { type: 'text' },
                                details: { type: 'text' },
                                image: { type: 'keyword' },
                                createdAt: { type: 'date' },
                                author: {
                                    properties: {
                                        id: { type: 'integer' },
                                        name: { type: 'keyword' },
                                    }
                                },
                                categories: {
                                    type: 'nested',
                                    properties: {
                                        id: { type: 'integer' },
                                        name: { type: 'keyword' }
                                    }
                                },
                            },
                        },
                    },
                });
                console.log(`Index created: ${INDEX_NAME}`);
            }
            else {
                console.log(`Index already exists: ${INDEX_NAME}`);
            }
        }
        catch (error) {
            console.error("Error creating index:", error);
        }
    });
}
function indexNews() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield createIndex();
            const totalCount = yield postgres_1.newsModel.count();
            console.log(`Total news articles to process: ${totalCount}`);
            for (let offset = 0; offset < totalCount; offset += BATCH_SIZE) {
                const newsList = yield postgres_1.newsModel.findAll({
                    offset,
                    limit: BATCH_SIZE,
                    attributes: ['id', 'title', 'description', 'image', 'createdAt'],
                    include: [
                        {
                            model: postgres_1.userModel,
                            as: 'user',
                            attributes: ['id', 'firstName'],
                        },
                        {
                            model: postgres_1.categoryModel,
                            as: 'categories',
                            attributes: ['id', 'name'],
                            through: { attributes: [] },
                        },
                    ],
                });
                const body = newsList.flatMap(news => {
                    var _a;
                    return [
                        console.log(news),
                        { index: { _index: INDEX_NAME, _id: news.id.toString() } },
                        {
                            id: news.id,
                            headline: news.title,
                            details: news.description,
                            image: news.image,
                            createdAt: news.createdAt,
                            author: news.user ? {
                                id: news.user.id,
                                name: news.user.firstName,
                            } : null,
                            categories: (_a = news.categoryIds) === null || _a === void 0 ? void 0 : _a.map((category) => ({
                                id: category.id,
                                name: category.name,
                            })),
                        },
                    ];
                });
                if (body.length) {
                    const { errors } = yield elasticSearch_1.esClient.bulk({ refresh: true, body });
                    if (errors) {
                        console.error('Errors during bulk indexing:', errors);
                    }
                    else {
                        console.log(`Indexed ${newsList.length} news articles.`);
                    }
                }
            }
            console.log('Indexing completed.');
        }
        catch (error) {
            console.error('Error occurred during indexing:', error);
        }
    });
}
// Run the indexing process
indexNews().catch(console.error);
