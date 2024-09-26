import { esClient } from "../config/elasticSearch"; // Assuming you've already set this up
import { newsModel, userModel, categoryModel } from "../postgres/postgres"; // Your Sequelize models

const BATCH_SIZE = 1000; // Adjust the batch size according to your needs
const INDEX_NAME = 'news'; // Elasticsearch index name

// Step 1: Create the Elasticsearch index with mappings
async function createIndex() {
  try {
    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    if (!indexExists) {
      await esClient.indices.create({
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
    } else {
      console.log(`Index already exists: ${INDEX_NAME}`);
    }
  } catch (error) {
    console.error("Error creating index:", error);
  }
}

// Step 2: Index news articles in batches
async function indexNews() {
  try {
    await createIndex(); // Ensure index exists before indexing data

    const totalCount = await newsModel.count(); // Get total number of news articles
    console.log(`Total news articles to process: ${totalCount}`);

    for (let offset = 0; offset <totalCount ; offset += BATCH_SIZE) {
      const newsList = await newsModel.findAll({
        offset,
        limit: BATCH_SIZE,
        attributes: ['id', 'title', 'description', 'image', 'createdAt'],
        include: [
          {
            model: userModel,
            as: 'user',
            attributes: ['id', 'firstName'], // Fetch user's id and name
          },
          {
            model: categoryModel,
            as: 'categories',
            attributes: ['id', 'name'], // Fetch category id and name
            through: { attributes: [] }, // Exclude attributes from the join table
          },
        ],
      });

      const body = newsList.flatMap(news => [
        { index: { _index: INDEX_NAME, _id: news.id!.toString() } }, // Index each news by ID
        {
          id: news.id,
          headline: news.title,
          details: news.description,
          image: news.image,
          createdAt: news.createdAt,
          author: news.user ? {
            id: news.user.id,
            name: news.user.firstName,
          } : null, // If author exists, index it
          // updated here CategoryIds made categories because of storing
          categories: news.categories?.map((category: { id: number; name: string }) => ({
            id: category.id,
            name: category.name,
          })) || [], // Map over categories to index them
        },
      ]);

      if (body.length) {
        const { errors } = await esClient.bulk({ refresh: true, body });
        if (errors) {
          console.error('Errors during bulk indexing:', errors);
        } else {
          console.log(`Indexed ${newsList.length} news articles.`);
        }
      }
    }

    console.log('Indexing completed.');
  } catch (error) {
    console.error('Error occurred during indexing:', error);
  }
}

// Step 3: Run the indexing process
indexNews().catch(console.error);
