import { Request, Response } from 'express';
import { newsModel, userModel } from '../postgres/postgres'; // Adjust the import path to your actual model
import { newsTransform } from '../transform/transform';
import { newsValidationSchema } from '../validation/newsdataValidation';
import { UploadedFile } from 'express-fileupload';
import { generateRandom, imageValidator,removeImage} from '../utils/helper';
import { any } from 'zod';

// Get all news articles

export const newsIndex = async (req: Request, res: Response) => {
    let page: number = parseInt(req.query.page as string, 10) || 1;
    let limit: number = parseInt(req.query.limit as string, 10) || 10;
  
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;
  
    const skip = (page - 1) * limit;
  
    try {
      const news = await newsModel.findAll({
        limit: limit,
        offset: skip,
        include: [
          {
            model: userModel,
            as: "user",
            attributes: ["id", "firstName", "profile"],
          },
        ],
        attributes: ["id", "title", "description", "image", "createdAt"],
      });
  
      const newsTransformed = news.map((item) => newsTransform(item as any));
  
      const totalNews = await newsModel.count();
      const totalPages = Math.ceil(totalNews / limit);
  
      return res.json({
        status: 200,
        news: newsTransformed,
        metadata: {
          totalPages: totalPages,
          currentPage: page,
          limit: limit,
        },
      });
    } catch (error) {
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
      let categoryId=parseInt(body.categoryId);
      body.categoryId=categoryId;
      // Validate the request body using Zod
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
  
      // Respond with the created news entry
      return res.json(createdNews);
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
      
      // Fetch news with the specific ID and include user information
      const news = await newsModel.findOne({
        where: { id: id },
        include: [
          {
            model: userModel,
            as: 'user', // Match the alias from the association
            attributes: ['id', 'firstName', 'email'] // Only select these user attributes
          }
        ]
      });
  
      if (!news) {
        // If no news article is found, return a 404 status
        return res.status(404).json({ message: 'News article not found' });
      }
  
      // Transform the news using the `newsTransform` function
      const transformedNews = newsTransform(news as any);
  
      // Return the transformed news data in the response
      return res.json(transformedNews);
    } catch (error) {
      // If there is an error, return a 500 status with the error message
      return res.status(500).json({ message: 'Error retrieving news article', error });
    }
  };

// Update a specific news article by ID
export const newsUpdate = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user;
  
      // Find the news by ID
      const news = await newsModel.findOne({
        where: { id: id }
      });
  
      if (!news) {
        return res.status(404).json({ status: 404, message: "News not found" });
      }
  
      // Check if the logged-in user is authorized to update the news (only the owner can update)
      if (user.id !== news.userId) {
        return res.status(403).json({ status: 403, message: "Unauthorized" });
      }

      // Validate the request body using Zod
      const body=req.body;
      if(body.title==null){body.title=news.title}
      if(body.description==null){body.description=news.description}
      if(body.categoryId==null){body.categoryId=news.categoryId}
      if(body.image==null){body.image=news.image}
      body.userId=news.userId

    console.log(body);

      const payload = newsValidationSchema.parse(req.body);
  
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
        image.mv(uploadPath, (err) => {
          if (err) {
            throw err;
          }
        });
  
        // Remove the old image if it exists
        if (news.image) {
          removeImage(news.image);
        }
  
        // Add image name to payload
        payload.image = imageName;
      }
  
      // Update the news entry
      await newsModel.update(payload, {
        where: { id: id }
      });
  
      return res.status(200).json({ status: 200, message: "News updated successfully" });
    } catch (err) {
      if (err instanceof Error) {
       
        return res.status(400).json({ status: 400, message: err.message });
      } else if (err instanceof Error) {
        return res.status(500).json({ status: 500, message: err.message });
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
  
      // Optionally remove the associated image from the server
      if (news.image) {
        removeImage(news.image); // Assuming you have a function to remove images
      }
  
      // Delete the news entry
      await newsModel.destroy({
        where: { id: id }
      });
  
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