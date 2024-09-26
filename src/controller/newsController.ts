import { Request, Response } from "express";
import { categoryModel, newsModel, userModel, visitorModel, visitorViewModel } from "../postgres/postgres"; // Adjust the import path to your actual model
import { newsTransform } from "../transform/transform";
import { newsValidationSchema } from "../validation/newsdataValidation";
import { UploadedFile } from "express-fileupload";
import { generateRandom, imageValidator, removeImage } from "../utils/helper";
import { any } from "zod";
import { Op, Sequelize } from "sequelize";
// import redisCache from '../config/redis.config';
import { esClient } from "../config/elasticSearch";
import { getRecommendedNews, indexNewsInElasticsearch } from "./elasticSearch";
import { emitNewsDeleted } from "..";

export const newsIndex = async (req: Request, res: Response) => {
  const { query } = req;
  const userId = query?.userId as string;
  const search = query?.search as string;
  const categoryQuery = query?.category as string;

  let page: number = Math.max(parseInt(query.page as string, 10) || 1, 1);
  let limit: number = Math.max(Math.min(parseInt(query.limit as string, 50) || 20, 100), 1);
  const skip = (page - 1) * limit;

  const must: any[] = [];
  
  // Add userId filter if provided
  if (userId) {
    must.push({ match: { "author.id": parseInt(userId) } });
  }

  // Add category filter if provided
  if (categoryQuery) {
    must.push({
      nested: {
        path: "categories",
        query: {
          match: { "categories.name": categoryQuery }
        }
      }
    });
  }

  // Add search logic if provided
  if (search) {
    must.push({
      bool: {
        should: [
          { match_phrase_prefix: { headline: search } },
          { match_phrase_prefix: { details: search } },
        ]
      }
    });
  }

  // Build the final search query
  const searchQuery = { 
    bool: {
      must
    }
  };

  try {
    // Fetch news from Elasticsearch
    const esResponse = await esClient.search({
      index: "news",
      body: {
        query: searchQuery,
        sort: [{ createdAt: { order: "desc" } }],
        from: skip,
        size: limit,
        track_total_hits: true,
      },

    });

    const esNews = esResponse.hits.hits.map((hit: any) => ({
      id: hit._id,
      headline: hit._source.headline, // Adjust to your data structure
      details: hit._source.details, // Adjust to your data structure
      image: hit._source.image,
      createdAt: hit._source.createdAt,
      author: hit._source.author,
      categories: hit._source.categories,
    }));

    const totalNews =
      typeof esResponse.hits.total === "number"
        ? esResponse.hits.total
        : esResponse.hits.total?.value || 0;

    return res.json({
      news: esNews,
      totalNews: totalNews,
      currentPage: page,
      limit: limit,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};






// Create a new news article

interface AuthenticatedRequest extends Request {
  user: {
    email: string;
    id: number;
  };
  files?: {
    image?: UploadedFile; // Use UploadedFile for single file
  };
}
export const newsStore = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const user = req.user; // Assuming `req.user` is populated by your auth middleware
    let body = req.body;

    // Attach userId to the request body
    body.userId = user.id;

    // Handle category IDs (convert to array of numbers)
    let categoryIds: number[] = [];
    if (body.categoryIds) {
      categoryIds = body.categoryIds
        .split(",")
        .map((id: string) => parseInt(id));
    }

    // Validate the request body using Zod
    body.categoryIds = categoryIds;
    const validator = newsValidationSchema.safeParse(body);
    if (!validator.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validator.error.format(),
      });
    }
    const payload = validator.data;

    // Check if an image was uploaded
    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: "Image required" });
    }

    const image = req.files.image as UploadedFile;

    // Validate image size and type
    const messages = imageValidator(image.size, image.mimetype);
    if (messages) {
      return res.status(400).json({ message: messages });
    }

    // Handle the file upload
    const imgExt = image.name.split(".").pop(); // Get the file extension
    const imageName = generateRandom() + "." + imgExt; // Generate a random image name
    const uploadPath = process.cwd() + "/public/news/" + imageName;

    // Move the uploaded image to the specified path
    await image.mv(uploadPath);

    // Add the image name and user ID to the payload
    payload.image = imageName;
    payload.userId = user.id;

    // Create the news entry in the database
    const createdNews = await newsModel.create(payload);

    // Associate categories with the news entry
    if (categoryIds.length > 0) {
      await createdNews.setCategories(categoryIds);
    }

    // Fetch the news with associations (user and categories)
    const newsWithAssociations = await newsModel.findOne({
      where: { id: createdNews.id },
      include: [
        { model: categoryModel, as: "categories" }, // Fetch categories
        { model: userModel, as: "user" },  // Fetch the user who created the news
      ],
    });

    // If newsWithAssociations is null, return an error
    if (!newsWithAssociations) {
      return res.status(404).json({ message: "News not found" });
    }

    // Prepare the payload for Elasticsearch indexing
    const esPayload = {
      id: newsWithAssociations.id,
      headline: newsWithAssociations.title,
      details: newsWithAssociations.description,
      image: newsWithAssociations.image,
      createdAt: newsWithAssociations.createdAt,
      author: {
        id: newsWithAssociations.user.id,
        name: newsWithAssociations.user.firstName,
      },
      categories: newsWithAssociations.categories.map((category: any) => ({
        id: category.id,
        name: category.name,
      })),
    };

  
  indexNewsInElasticsearch(esPayload)

    return res.json(newsWithAssociations);
  } catch (err: any) {
    // Catch and handle any errors
    console.error("Error:", err);
    return res.status(400).json({
      status: 400,
      message: err.message || "An error occurred",
    });
  }
};


// Get a specific news article by ID

// export const newsShow = async (
//   req: Request,
//   res: Response
// ): Promise<Response> => {
//   try {
//     const { id } = req.params; 

//     const news = await newsModel.findOne({
//       where: { id: id },
//       include: [
//         {
//           model: userModel,
//           as: "user", 
//           attributes: ["id", "firstName", "email"], 
//         },
//         {
//           model: categoryModel,
//           as: "categories", 
//           attributes: ["id", "name"],
//           through: { attributes: [] }, 
//         },
//       ],
//     });

//     if (!news) {
  
//       return res.json({ message: "News article not found" });
//     }

//     const transformedNews = newsTransform(news as any);


//     return res.json(transformedNews);
//   } catch (error) {
//     console.error("Error retrieving news article:", error);
    
//     return res
//       .status(500)
//       .json({ message: "Error retrieving news article", error });
//   }
// };



export const newsShow = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const visitor = (req as any).visitor; // Get the visitor from the middleware

    // Find the news article by its id
    const news = await newsModel.findOne({
      where: { id: id },
      include: [
        {
          model: userModel,
          as: "user", 
          attributes: ["id", "firstName", "email"],
        },
        {
          model: categoryModel,
          as: "categories",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
    });

    if (!news) {
      return res.status(404).json({ message: "News article not found" });
    }

    // Track the visitor view count in the visitorViewModel
    if (visitor) {
            const [visitorView, created] = await visitorViewModel.findOrCreate({
             where: { visitorId: visitor.id, newsId: news.id },
             defaults: {
               visitorId: visitor.id,
                newsId: Number(news.id),
                viewCount: 1
              }
            });
      
            if (!created) {
              await visitorView.increment('viewCount');
            }
          }

    // Transform the news object before sending it back
    const transformedNews = newsTransform(news as any);

    return res.json(transformedNews);
  } catch (error) {
    console.error("Error retrieving news article:", error);
    return res
      .status(500)
      .json({ message: "Error retrieving news article", error });
  }
};


export const newsUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Find the news by ID
    const news = await newsModel.findOne({ where: { id } });

    if (!news) {
      return res.status(404).json({ status: 404, message: "News not found" });
    }

    // Check if the logged-in user is authorized to update the news
    if (user.id !== news.userId) {
      return res.status(403).json({ status: 403, message: "Unauthorized" });
    }

    let body = {
      title: req.body.title || news.title,
      description: req.body.description || news.description,
      image: news.image, // Use existing image by default
      categoryIds: req.body.categoryIds || news.categoryIds,
      userId: news.userId, // Keep the existing userId
    };

    let categoryIds: number[] = [];
    if (body.categoryIds) {
      categoryIds = body.categoryIds
        .split(",")
        .map((id: string) => parseInt(id));
    }

    // Validate the request body using Zod
    body.categoryIds = categoryIds;
    const validator = newsValidationSchema.safeParse(body);
    if (!validator.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validator.error.format(),
      });
    }

    const payload = validator.data;

    // Handle image upload if an image is provided
    const image = req.files?.image as UploadedFile;
    if (image) {
      // Validate image size and type
      const message = imageValidator(image.size, image.mimetype);
      if (message) {
        return res.status(400).json({ message });
      }

      // Handle file upload
      const imgExt = image.name.split(".").pop();
      const imageName = generateRandom() + "." + imgExt;
      const uploadPath = process.cwd() + "/public/news/" + imageName;

      // Move the uploaded image to the specified path
      await image.mv(uploadPath);

      // Remove the old image if it exists
      if (news.image) {
        removeImage(news.image);
      }

      // Update the image name in the payload
      payload.image = imageName;
    }

    // Update the news entry in the database
    await newsModel.update(payload, { where: { id } });

    // Associate categories with the news entry if category IDs are provided
    if (categoryIds.length > 0) {
      await news.setCategories(categoryIds);
    }

    // Fetch the updated news with associations (user and categories) for indexing
    const updatedNews = await newsModel.findOne({
      where: { id },
      include: [
        { model: categoryModel, as: "categories" }, // Fetch categories
        { model: userModel, as: "user" }, // Fetch the user who created the news
      ],
    });

    // If updatedNews is null, return an error
    if (!updatedNews) {
      return res.status(404).json({ message: "News not found" });
    }

    // Prepare the payload for Elasticsearch indexing
    const esPayload = {
      id: updatedNews.id,
      headline: updatedNews.title,
      details: updatedNews.description,
      image: updatedNews.image,
      createdAt: updatedNews.createdAt,
      author: {
        id: updatedNews.user.id,
        name: updatedNews.user.firstName,
      },
      categories: updatedNews.categories.map((category: any) => ({
        id: category.id,
        name: category.name,
      })),
    };

    // Index the updated news in Elasticsearch
    await indexNewsInElasticsearch(esPayload);

    return res.json({ message: "News updated successfully" });
  } catch (err: any) {
    console.error("Error:", err);
    return res.status(500).json({
      message: err.message || "An error occurred",
    });
  }
};
// Delete a specific news article by ID
export const newsDestroy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req;

    // Find the news entry by ID
    const news = await newsModel.findOne({
      where: { id: id },
    });

    // Check if the news exists
    if (!news) {
      return res.status(404).json({ status: 404, message: "News not found" });
    }

    // Check if the logged-in user is authorized to delete the news (only the owner can delete)
    if (user.id !== news.userId) {
      return res.status(403).json({ status: 403, message: "Unauthorized" });
    }

    // Remove the associated image from the server, if it exists
    if (news.image) {
      try {
        removeImage(news.image); // Assuming you have a function to remove images
      } catch (err) {
        console.error("Error removing image:", err);
      }
    }

    // Delete the news entry
    await newsModel.destroy({
      where: { id: id },
    });

    // Delete the document from Elasticsearch
    await esClient.delete({
      index: 'news',
      id: id.toString(), // Ensure the ID is a string
    });


      emitNewsDeleted(id)
 
 

    return res
      .status(200)
      .json({ status: 200, message: "News deleted successfully" });
  } catch (err) {
    // Type narrowing to handle 'unknown' type
    if (err instanceof Error) {
      console.error("Error:", err.message);
      return res.status(500).json({
        status: 500,
        message: err.message || "An error occurred",
      });
    }

    // Fallback for cases where the error isn't an instance of Error
    return res.status(500).json({
      status: 500,
      message: "An unknown error occurred",
    });
  }
};



export const recommendNews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Get the news id from the request params
    const limit = 10; // Number of recommendations to return

    // Fetch the news article by ID and include its categories
    const news = await newsModel.findOne({
      where: { id: id },
      include: [{
        model: categoryModel,
        as: 'categories',
        through: { attributes: [] } // Ignore pivot table attributes
      }]
    });

    if (!news) {
      return res.status(404).json({ message: 'News article not found' });
    }

    // Extract category IDs from the news article
    const categoryIds = news.categories.map((category: any) => category.id);

    if (categoryIds.length === 0) {
      return res.status(200).json({ recommendations: [] });
    }

    // Get recommendations based on category overlap, excluding the original news article
    const recommendations = await newsModel.findAll({
      include: [
        {
          model: categoryModel,
          as: 'categories',
          where: { id: { [Op.in]: categoryIds } },
          through: { attributes: [] }
        },
        {
          model: userModel,
          as: 'user',
          attributes: ['id', 'firstName', 'email']
        },
        {
          model: visitorViewModel,
          as: 'visitorViews',
          attributes: ['viewCount'], // Fetch view count directly
          required: false // Optional join to keep articles without views
        }
      ],
      where: {
        id: { [Op.not]: id } // Exclude the current news article from recommendations
      },
      order: [
        [{ model: visitorViewModel, as: 'visitorViews' }, 'viewCount', 'DESC'], 
        ['createdAt', 'DESC']
      ],
      limit
    });

    // Transform the recommendations for response
    // Transform the recommendations for response
const transformedRecommendations = recommendations.map((news: any) => {
  const viewCount = news.visitorViews.length > 0 ? news.visitorViews[0].viewCount : 0; // Fetch view count
  return {
    id: news.id,
    headline: news.title,
    details: news.description,
    image: news.image,
    createdAt: news.createdAt,
    viewCount: viewCount, // Ensure view count is set correctly
    author: {
      id: news.user.id,
      name: news.user.firstName,
      email: news.user.email
    },
    categories: news.categories.map((category: any) => ({
      id: category.id,
      name: category.name
    }))
  };
});

    // Sort recommendations by view count (secondary sort by createdAt)
    transformedRecommendations.sort((a, b) => {
      const viewCountA = a.viewCount || 0;
      const viewCountB = b.viewCount || 0;
      if (viewCountA !== viewCountB) {
        return viewCountB - viewCountA; // Descending order
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Then sort by createdAt
    });

    return res.status(200).json({ recommendations: transformedRecommendations });
  } catch (error) {
    console.error('Error recommending news:', error);
    return res.status(500).json({ message: 'Error recommending news' });
  }
};




// export const recommendNews = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params; // Get the news ID from request params
//     const limit = 10; // Number of recommendations to return

//     // Fetch the news article by ID and include its categories
//     const news = await newsModel.findOne({
//       where: { id: id },
//       include: [{
//         model: categoryModel,
//         as: 'categories',
//         through: { attributes: [] } // Ignore pivot table attributes
//       }]
//     });

//     if (!news) {
//       return res.status(404).json({ message: 'News article not found' });
//     }

//     // Extract category IDs from the news article
//     const categoryIds = news.categories.map((category: any) => category.id);

//     if (categoryIds.length === 0) {
//       return res.status(200).json({ recommendations: [] });
//     }

//     // Fetch recommendations based on highest viewCount, excluding the current news
//     const recommendations = await newsModel.findAll({
//       include: [
//         {
//           model: categoryModel,
//           as: 'categories',
//           where: { id: { [Op.in]: categoryIds } }, // Match articles in the same categories
//           through: { attributes: [] }
//         },
//         {
//           model: userModel,
//           as: 'user',
//           attributes: ['id', 'firstName', 'email'] // Include user details
//         },
//         {
//           model: visitorViewModel,
//           as: 'visitorViews', // Ensure this matches your Sequelize alias
//           attributes: ['viewCount'] // Get view counts
//         }
//       ],
//       where: {
//         id: { [Op.not]: id } // Exclude the original news article
//       },
//       order: [
//         [Sequelize.col('"visitorViews.viewCount"'), 'DESC'], // Order by viewCount
//         ['createdAt', 'DESC'] // Fallback to createdAt if viewCount is equal
//       ],
//       limit
//     });

//     // Transform recommendations to expected output format
//     const transformedRecommendations = recommendations.map((news: any) => ({
//       id: news.id,
//       headline: news.title,
//       details: news.description,
//       image: news.image,
//       createdAt: news.createdAt,
//       viewCount: news.visitorViews?.viewCount || 0, // Fallback to 0 if no viewCount
//       author: {
//         id: news.user.id,
//         name: news.user.firstName,
//         email: news.user.email
//       },
//       categories: news.categories.map((category: any) => ({
//         id: category.id,
//         name: category.name
//       }))
//     }));

//     // Return recommendations
//     return res.status(200).json({ recommendations: transformedRecommendations });

//   } catch (error) {
//     console.error('Error recommending news:', error);
//     return res.status(500).json({ message: 'Error recommending news' });
//   }
// };


