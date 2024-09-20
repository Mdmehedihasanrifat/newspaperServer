import { Request, Response } from "express";
import { categoryModel, newsModel, userModel } from "../postgres/postgres"; // Adjust the import path to your actual model
import { newsTransform } from "../transform/transform";
import { newsValidationSchema } from "../validation/newsdataValidation";
import { UploadedFile } from "express-fileupload";
import { generateRandom, imageValidator, removeImage } from "../utils/helper";
import { any } from "zod";
import { Op } from "sequelize";
// import redisCache from '../config/redis.config';
import { promisify } from "util";
// Get all news articles
export const newsIndex = async (req: Request, res: Response) => {
  const { query } = req;
  const userId = query?.userId as string;
  const categoryQuery = query?.category as string; // This could be either a category ID or name

  // Convert userId to a number (if provided)
  const userIdNumber = userId ? parseInt(userId) : undefined;

  // Set default pagination values
  let page: number = Math.max(parseInt(query.page as string, 10) || 1, 1);
  let limit: number = Math.max(
    Math.min(parseInt(query.limit as string, 50) || 20, 100),
    1
  );

  // Calculate pagination offset
  const skip = (page - 1) * limit;

  // Create where clause based on userId
  const whereClause: any = {};
  if (userIdNumber) {
    whereClause.userId = userIdNumber;
  }

  let categoryIdNumber: number | undefined;
  try {
    // If categoryQuery is a number, treat it as a category ID, otherwise treat it as a category name
    if (!isNaN(Number(categoryQuery))) {
      categoryIdNumber = parseInt(categoryQuery);
    } else if (categoryQuery) {
      // Find the category by name
      const category = await categoryModel.findOne({
        where: { name: categoryQuery },
        attributes: ["id"],
      });

      if (category) {
        categoryIdNumber = category.id;
      } else {
        // If no category found, return an empty result set
        return res.json({
          news: [],
          totalNews: 0,
          currentPage: page,
          limit: limit,
          categories: [],
        });
      }
    }

    // Fetch news items with optional userId and category filter
    const news = await newsModel.findAll({
      where: whereClause,
      attributes: ["id", "title", "description", "image", "createdAt"],
      include: [
        {
          model: userModel,
          as: "user",
          attributes: ["id", "firstName", "profile"],
        },
        {
          model: categoryModel,
          as: "categories", // Join the 'categories' table for filtering
          attributes: ["id", "name"],
          through: { attributes: [] }, // Hide the junction table data if it's a many-to-many relationship
          where: categoryIdNumber ? { id: categoryIdNumber } : undefined, // Filter by category if provided
        },
      ],
      order: [["createdAt", "DESC"]],
      offset: skip,
      limit: limit,
    });

    const newsTransformed = news.map((item) => newsTransform(item as any));

    // Calculate total news count (with userId and category filters if provided)
    const totalNews = await newsModel.count({
      where: whereClause,
      include: categoryIdNumber
        ? [
            {
              model: categoryModel,
              as: "categories", // Join the 'categories' table for the count query as well
              where: { id: categoryIdNumber },
            },
          ]
        : [],
    });

    // Fetch all categories (for the dropdown or navigation)
    const categories = await categoryModel.findAll({
      attributes: ["id", "name"],
    });

    // Return the paginated news with metadata and all categories
    return res.json({
      news: newsTransformed,
      totalNews: totalNews,
      currentPage: page,
      limit: limit,
      categories: categories, // Include all categories in the response
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
// const delAsync = promisify(redisCache.del).bind(redisCache);
export const newsStore = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const user = req.user; // Assuming `req.user` is populated by your auth middleware
    let body = req.body;
    console.log(body);
    // Attach userId to the request body
    body.userId = user.id;
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
      return res
        .status(400)
        .json({
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
    await image.mv(uploadPath); // Use the async/await pattern for image move

    // Add the image name and user ID to the payload
    payload.image = imageName;
    payload.userId = user.id;

    // Create the news entry in the database
    const createdNews = await newsModel.create(payload);
    const newsWithAssociations = await createdNews.reload({
      include: [{ model: categoryModel, as: "categories" }],
    });

    // Associate categories with the news entry
    if (categoryIds.length > 0) {
      await newsWithAssociations.addCategories(categoryIds);
    }

    // Respond with the created news entry

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

export const newsShow = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params; // Get the `id` from the request params

    // Fetch the news article by ID and include user information
    const news = await newsModel.findOne({
      where: { id: id },
      include: [
        {
          model: userModel,
          as: "user", // Ensure this matches the alias in your association
          attributes: ["id", "firstName", "email"], // Only select these user attributes
        },
        {
          model: categoryModel,
          as: "categories", // Assuming there's an association for categories
          attributes: ["id", "name"],
          through: { attributes: [] }, // Hide any join table attributes if using many-to-many relation
        },
      ],
    });

    if (!news) {
      // Return a 404 response if the news article is not found
      return res.status(404).json({ message: "News article not found" });
    }

    // Transform the news data using the `newsTransform` function
    const transformedNews = newsTransform(news as any);

    // Return the transformed news data in the response
    return res.json(transformedNews);
  } catch (error) {
    console.error("Error retrieving news article:", error);
    // Return a 500 status with the error message
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

    return res
      .status(200)
      .json({ status: 200, message: "News updated successfully" });
  } catch (err: any) {
    console.error("Error:", err);
    return res.status(400).json({
      status: 400,
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

    // Log successful deletion
    console.log(`News article with ID ${id} deleted by user ${user.id}`);

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

// Search for news articles based on a query parameter
export const newsSearch = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { query } = req.query; // Get the search query from the request

    console.log(query);
    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "Invalid search query" });
    }

    // Debugging: Log the search query
    console.log("Search Query:", query);

    // Use a case-insensitive search for news titles and descriptions
    const news = await newsModel.findAll({
      where: {
        [Op.or]: [
          {
            title: {
              [Op.iLike]: `%${query}%`, // Use iLike for case-insensitive search
            },
          },
          {
            description: {
              [Op.iLike]: `%${query}%`,
            },
          },
        ],
      },
      attributes: ["id", "title", "description", "image", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    // Debugging: Log the SQL query generated by Sequelize
    // You can enable Sequelize logging to see the SQL query in your console

    if (news.length === 0) {
      return res.status(404).json({ message: "No articles found" });
    }

    // Return the search results
    return res.json({
      status: 200,
      news,
    });
  } catch (error) {
    console.error("Error searching news articles:", error);
    return res
      .status(500)
      .json({ message: "Error searching news articles", error });
  }
};

