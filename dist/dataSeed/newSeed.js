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
const postgres_1 = require("../postgres/postgres");
const faker_1 = require("@faker-js/faker"); // Import faker for generating fake data
// Helper function to generate random news data using Faker
function generateFakeNewsData(count) {
    const newsData = [];
    for (let i = 0; i < count; i++) {
        newsData.push({
            title: faker_1.faker.lorem.sentence(), // Random title
            description: faker_1.faker.lorem.paragraph(), // Random description
            image: faker_1.faker.image.url(), // Random image URL
            userId: faker_1.faker.number.int({ min: 1, max: 4 }), // Random userId between 1 and 10
            createdAt: faker_1.faker.date.past().toISOString(), // Random past date
            updatedAt: faker_1.faker.date.recent().toISOString(), // Recent date
        });
    }
    return newsData;
}
// Generate a set number of fake news articles
const newsData = generateFakeNewsData(1000); // Generating 10 fake news items
// Helper function to generate random category IDs
function generateRandomCategoryIds(maxCategories, maxId) {
    const categoryIds = [];
    const numberOfCategories = Math.floor(Math.random() * maxCategories) + 1; // Random number of categories (1 to maxCategories)
    while (categoryIds.length < numberOfCategories) {
        const randomId = Math.floor(Math.random() * maxId) + 1; // Random category ID between 1 and maxId
        if (!categoryIds.includes(randomId)) {
            categoryIds.push(randomId); // Ensure no duplicates
        }
    }
    return categoryIds;
}
// Function to insert each news entry with TypeScript types
function insertNewsData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            for (const newsItem of newsData) {
                // Create the news entry in the database
                const createdNews = yield postgres_1.newsModel.create({
                    title: newsItem.title,
                    description: newsItem.description,
                    image: newsItem.image,
                    userId: newsItem.userId,
                    createdAt: new Date(newsItem.createdAt),
                    updatedAt: new Date(newsItem.updatedAt),
                });
                // Generate random category IDs (up to 3 categories, with category IDs from 1 to 20)
                const randomCategoryIds = generateRandomCategoryIds(3, 20);
                if (randomCategoryIds.length > 0) {
                    yield createdNews.addCategories(randomCategoryIds); // Add categories using the association method
                }
                console.log(`News item "${newsItem.title}" inserted successfully with categories: ${randomCategoryIds}`);
            }
        }
        catch (error) {
            console.error("Error inserting news data:", error.message);
        }
    });
}
// Call the function to insert the data
insertNewsData();
