// import { newsModel } from '../postgres/postgres';
// import { categoryModel } from '../postgres/postgres';
// import fs from 'fs';

// // Define the structure of your news data
// interface NewsItem {
//   title: string;
//   description: string;
//   image: string;
//   userId: number;
//   createdAt: string;
//   updatedAt: string;
// }

// // Read the JSON file or a JSON string (you can also use require if the data is static)
// const jsonData = fs.readFileSync('../../data/filteredArticles.json', 'utf8');

// // Parse the JSON data into an array of NewsItem objects
// const newsData: NewsItem[] = JSON.parse(jsonData);
// console.log(newsData)

// // Helper function to generate random category IDs
// function generateRandomCategoryIds(maxCategories: number, maxId: number): number[] {
//   const categoryIds: number[] = [];
//   const numberOfCategories = Math.floor(Math.random() * maxCategories) + 1; // Random number of categories (1 to maxCategories)

//   while (categoryIds.length < numberOfCategories) {
//     const randomId = Math.floor(Math.random() * maxId) + 1; // Random category ID between 1 and maxId
//     if (!categoryIds.includes(randomId)) {
//       categoryIds.push(randomId);  // Ensure no duplicates
//     }
//   }

//   return categoryIds;
// }

// // Function to insert each news entry with TypeScript types
// async function insertNewsData(): Promise<void> {
//   try {
//     for (const newsItem of newsData) {
//       // Create the news entry in the database
//       const createdNews = await newsModel.create({
//         title: newsItem.title,
//         description: newsItem.description,
//         image: newsItem.image,
//         userId: newsItem.userId,
//         createdAt: new Date(newsItem.createdAt),
//         updatedAt: new Date(newsItem.updatedAt),
//       });

//       // Generate random category IDs (up to 3 categories, with category IDs from 1 to 10)
//       const randomCategoryIds = generateRandomCategoryIds(3, 20);

//       if (randomCategoryIds.length > 0) {
//         await createdNews.addCategories(randomCategoryIds);  // Add categories using the association method
//       }

//       console.log(`News item with ID ${newsItem.title} inserted successfully with categories: ${randomCategoryIds}`);
//     }
//   } catch (error: any) {
//     console.error("Error inserting news data:", error.message);
//   }
// }

// // Call the function to insert the data
// insertNewsData();
import { newsModel } from '../postgres/postgres';

import { faker } from '@faker-js/faker'; // Import faker for generating fake data

// Define the structure of your news data
interface NewsItem {
  title: string;
  description: string;
  image: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

// Helper function to generate random news data using Faker
function generateFakeNewsData(count: number): NewsItem[] {
  const newsData: NewsItem[] = [];

  for (let i = 0; i < count; i++) {
    newsData.push({
      title: faker.lorem.sentence(), // Random title
      description: faker.lorem.paragraph(), // Random description
      image: faker.image.url(), // Random image URL
      userId:faker.number.int({ min: 1, max: 4 }) as number, // Random userId between 1 and 10
      createdAt: faker.date.past().toISOString(), // Random past date
      updatedAt: faker.date.recent().toISOString(), // Recent date
    });
  }

  return newsData;
}

// Generate a set number of fake news articles
const newsData: NewsItem[] = generateFakeNewsData(1000); // Generating 10 fake news items

// Helper function to generate random category IDs
function generateRandomCategoryIds(maxCategories: number, maxId: number): number[] {
  const categoryIds: number[] = [];
  const numberOfCategories = Math.floor(Math.random() * maxCategories) + 1; // Random number of categories (1 to maxCategories)

  while (categoryIds.length < numberOfCategories) {
    const randomId = Math.floor(Math.random() * maxId) + 1; // Random category ID between 1 and maxId
    if (!categoryIds.includes(randomId)) {
      categoryIds.push(randomId);  // Ensure no duplicates
    }
  }

  return categoryIds;
}

// Function to insert each news entry with TypeScript types
async function insertNewsData(): Promise<void> {
  try {
    for (const newsItem of newsData) {
      // Create the news entry in the database
      const createdNews = await newsModel.create({
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
        await createdNews.addCategories(randomCategoryIds);  // Add categories using the association method
      }

      console.log(`News item "${newsItem.title}" inserted successfully with categories: ${randomCategoryIds}`);
    }
  } catch (error: any) {
    console.error("Error inserting news data:", error.message);
  }
}

// Call the function to insert the data
insertNewsData();
