const fs = require('fs');

// Fetch and format all news data for Elasticsearch
async function fetchAndFormatNewsForElasticsearch(newsModel, categoryModel, whereClause, categoryIdNumber) {
  try {
    // Count total news articles based on your query
    const totalNews = await newsModel.count({
      where: whereClause,
      include: categoryIdNumber
        ? [
            {
              model: categoryModel,
              as: "categories",
              where: { id: categoryIdNumber },
            },
          ]
        : [],
    });

    console.log(`Total news articles: ${totalNews}`);

    // Fetch the news articles data
    const newsList = await newsModel.findAll({
      where: whereClause,
      include: [
        {
          model: categoryModel,
          as: "categories",
        },
      ],
    });

    const allNews = [];
    
    newsList.forEach((news) => {
      const indexEntry = {
        index: {
          _index: 'news',
          _id: news.id.toString(), // Convert ID to string
        },
      };

      const newsData = {
        title: news.headline,
        description: news.details,
        image: news.image,
        createdAt: news.createdAt,
        authorName: news.authorName, // Assuming 'authorName' is a valid field
        categories: news.categories.map((category) => ({
          id: category.id,      // Include both category id
          name: category.name,  // and category name
        })),
      };

      // Log each formatted entry to the console
      console.log(JSON.stringify(indexEntry), JSON.stringify(newsData));

      allNews.push(indexEntry);
      allNews.push(newsData);
    });

    // Convert all news entries to newline-delimited JSON strings for Elasticsearch
    const bulkData =
      allNews.map((item) => JSON.stringify(item)).join('\n') + '\n';

    // Write the bulk data to a JSON file for Elasticsearch bulk indexing
    fs.writeFileSync('bulk_news.json', bulkData);
    console.log(
      `Formatted a total of ${allNews.length / 2} news items for Elasticsearch indexing.`
    );
  } catch (error) {
    console.error('Error fetching and formatting news for Elasticsearch:', error);
  }
}

// Usage example with Sequelize models (assuming 'newsModel', 'categoryModel', and necessary Sequelize configurations are defined):
// fetchAndFormatNewsForElasticsearch(newsModel, categoryModel, yourWhereClause, categoryIdNumber);
