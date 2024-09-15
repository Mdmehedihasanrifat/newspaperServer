import { Request, Response } from 'express';
import { categoryModel, newsModel, userModel } from '../postgres/postgres'; // Adjust the import path to your actual model
import { newsTransform } from '../transform/transform';
import { newsValidationSchema } from '../validation/newsdataValidation';
import { UploadedFile } from 'express-fileupload';
import { generateRandom, imageValidator,removeImage} from '../utils/helper';
import { any } from 'zod';

// Get all news articles
export const newsIndex = async (req: Request, res: Response) => {
  // Set default pagination values
  let page: number = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
  let limit: number = Math.max(Math.min(parseInt(req.query.limit as string, 10) || 10, 100), 1);

  // Calculate pagination offset
  const skip = (page - 1) * limit;

  try {
      // Fetch news with pagination, user, and categories
      const news = await newsModel.findAll({
          limit,
          offset: skip,
          include: [
              {
                  model: userModel,
                  as: "user",
                  attributes: ["id", "firstName", "profile"],
              },
              {
                  model: categoryModel,
                  as: "categories", // Assuming you have a relation defined with this alias
                  attributes: ["id", "name"],
                  through: { attributes: [] }  // Hide the junction table data if it's a many-to-many relationship
              },
          ],
          attributes: ["id", "title", "description", "image", "createdAt"],
      });

      // Transform news data
      const newsTransformed = news.map(item => newsTransform(item as any));

      // Count total news items
      const totalNews = await newsModel.count();
      const totalPages = Math.ceil(totalNews / limit);

      // Return paginated news with metadata and categories
      return res.json({
          status: 200,
          news: newsTransformed,
          metadata: {
              totalPages,
              currentPage: page,
              limit,
          },
      });
  } catch (error) {
      // Log and return error response
      console.error('Error retrieving news:', error);
      return res.status(500).json({
          status: 500,
          message: 'Error retrieving news articles',
      });
  }
};

// Create a new news article

interface AuthenticatedRequest extends Request {
    user: {
      email: string;
      id:number;
    };
    files?: {
      image?: UploadedFile; // Use UploadedFile for single file
    };
  }
  
export const newsStore = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const user = req.user ;  // Assuming `req.user` is populated by your auth middleware
      let body = req.body;
  
      // Attach userId to the request body
      body.userId = user.id;
      let categoryIds: number[] = [];
      if (body.categoryIds) {
        categoryIds = body.categoryIds.split(',').map((id: string) => parseInt(id));
      }
      // Validate the request body using Zod
      body.categoryIds=categoryIds;
      const validator = newsValidationSchema.safeParse(body);
      if (!validator.success) {
        return res.status(400).json({ message: "Validation failed", errors: validator.error.format() });
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
      const imgExt = image.name.split('.').pop();  // Get the file extension
      const imageName = generateRandom() + "." + imgExt;  // Generate a random image name
      const uploadPath = process.cwd() + "/public/news/" + imageName;
  
      // Move the uploaded image to the specified path
      await image.mv(uploadPath);  // Use the async/await pattern for image move
  
      // Add the image name and user ID to the payload
      payload.image = imageName;
      payload.userId = user.id;
  
      // Create the news entry in the database
      const createdNews = await newsModel.create(payload);
      const newsWithAssociations = await createdNews.reload({
        include: [{ model: categoryModel, as: 'categories' }]
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

export const newsShow = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params; // Get the `id` from the request params

    // Fetch the news article by ID and include user information
    const news = await newsModel.findOne({
      where: { id: id },
      include: [
        {
          model: userModel,
          as: 'user', // Ensure this matches the alias in your association
          attributes: ['id', 'firstName', 'email'] // Only select these user attributes
        },
        {
          model: categoryModel,
          as: 'categories', // Assuming there's an association for categories
          attributes: ['id', 'name'],
          through: { attributes: [] }, // Hide any join table attributes if using many-to-many relation
        }
      ]
    });

    if (!news) {
      // Return a 404 response if the news article is not found
      return res.status(404).json({ message: 'News article not found' });
    }

    // Transform the news data using the `newsTransform` function
    const transformedNews = newsTransform(news as any);

    // Return the transformed news data in the response
    return res.json(transformedNews);
  } catch (error) {
    console.error('Error retrieving news article:', error);
    // Return a 500 status with the error message
    return res.status(500).json({ message: 'Error retrieving news article', error });
  }
};

// Update a specific news article by ID
export const newsUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Find the news by ID
    const news = await newsModel.findOne({ where: { id: id } });

    if (!news) {
      return res.status(404).json({ status: 404, message: "News not found" });
    }

    // Check if the logged-in user is authorized to update the news (only the owner can update)
    if (user.id !== news.userId) {
      return res.status(403).json({ status: 403, message: "Unauthorized" });
    }

    // Prepare the request body for validation
    const body = {
      title: req.body.title || news.title,
      description: req.body.description || news.description,
      image: news.image, // Set image to existing one by default
      userId: news.userId,
      categoryIds: req.body.categoryIds || news.categoryIds, // If categories need to be updated
    };

    // Validate the request body using Zod
    const validatedPayload = newsValidationSchema.safeParse(body);
    if (!validatedPayload.success) {
      return res.status(400).json({ message: "Validation failed", errors: validatedPayload.error.format() });
    }

    const payload = validatedPayload.data;

    // Handle image upload if an image is provided
    const image = req?.files?.image;
    if (image) {
      const message = imageValidator(image.size, image.mimetype);
      if (message !== null) {
        return res.status(400).json({ status: 400, message: message });
      }

      const imgExt = image.name.split(".").pop(); // Extract the file extension
      const imageName = generateRandom() + "." + imgExt;
      const uploadPath = process.cwd() + "/public/news/" + imageName;

      // Move the uploaded image to the specified path
      await image.mv(uploadPath);

      // Remove the old image if it exists
      if (news.image) {
        removeImage(news.image);
      }

      // Add the new image name to payload
      payload.image = imageName;
    }

    // Update the news entry in the database
    await newsModel.update(payload, { where: { id: id } });

    // If there are category updates, handle them here
    if (req.body.categoryIds) {
      const categoryIds = req.body.categoryIds.split(',').map((id: string) => parseInt(id));
      await news.setCategories(categoryIds);
    }

    return res.status(200).json({ status: 200, message: "News updated successfully" });
  } catch (err) {
    console.error(err);

    if (err instanceof Error) {
      return res.status(400).json({ status: 400, message: err.message });
    }
    return res.status(500).json({ status: 500, message: "Unknown error occurred" });
  }
};

// Delete a specific news article by ID
export const newsDestroy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req;

    // Find the news entry by ID
    const news = await newsModel.findOne({
      where: { id: id }
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
      where: { id: id }
    });

    // Log successful deletion
    console.log(`News article with ID ${id} deleted by user ${user.id}`);

    return res.status(200).json({ status: 200, message: "News deleted successfully" });
  } catch (err) {
    // Type narrowing to handle 'unknown' type
    if (err instanceof Error) {
      console.error("Error:", err.message);
      return res.status(500).json({
        status: 500,
        message: err.message || "An error occurred"
      });
    }

    // Fallback for cases where the error isn't an instance of Error
    return res.status(500).json({
      status: 500,
      message: "An unknown error occurred"
    });
  }
};
