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
const elasticSearch_1 = require("../config/elasticSearch"); // Assuming you've already set this up
const postgres_1 = require("../postgres/postgres"); // Your Sequelize models
const BATCH_SIZE = 1000; // Adjust the batch size according to your needs
const INDEX_NAME = 'recommendation'; // Elasticsearch index name
// Step 1: Create the Elasticsearch index with mappings
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
                                viewCount: { type: 'integer' }, // Add viewCount mapping
                                author: {
                                    properties: {
                                        id: { type: 'integer' },
                                        name: { type: 'keyword' }, // Store author's name as keyword for exact matches
                                    }
                                },
                                categories: {
                                    type: 'nested', // Nested for querying/filtering individual categories
                                    properties: {
                                        id: { type: 'integer' },
                                        name: { type: 'keyword' } // Store category name as keyword for filtering
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
// Step 2: Index news articles in batches
function indexNews() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield createIndex(); // Ensure index exists before indexing data
            const totalCount = yield postgres_1.newsModel.count(); // Get total number of news articles
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
                            attributes: ['id', 'firstName'], // Fetch user's id and name
                        },
                        {
                            model: postgres_1.categoryModel,
                            as: 'categories',
                            attributes: ['id', 'name'], // Fetch category id and name
                            through: { attributes: [] }, // Exclude attributes from the join table
                        },
                        {
                            model: postgres_1.visitorViewModel,
                            as: 'visitorViews',
                            attributes: ['viewCount'], // Fetch view count directly
                            required: false // Optional join to keep articles without views
                        }
                    ],
                });
                const body = newsList.flatMap(news => {
                    var _a;
                    // Get view count or default to 0 if not present
                    const viewCount = news.visitorViews.length > 0 ? news.visitorViews[0].viewCount : 0;
                    return [
                        { index: { _index: INDEX_NAME, _id: news.id.toString() } }, // Index each news by ID
                        {
                            id: news.id,
                            headline: news.title,
                            details: news.description,
                            image: news.image,
                            createdAt: news.createdAt,
                            viewCount: viewCount, // Include viewCount in the indexed document
                            author: news.user ? {
                                id: news.user.id,
                                name: news.user.firstName,
                            } : null, // If author exists, index it
                            categories: ((_a = news.categories) === null || _a === void 0 ? void 0 : _a.map((category) => ({
                                id: category.id,
                                name: category.name,
                            }))) || [], // Map over categories to index them
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
// Step 3: Run the indexing process
indexNews().catch(console.error);
