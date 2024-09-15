import { Request, Response } from 'express';
import { commentModel ,newsModel,userModel} from '../postgres/postgres';
import { User } from '../postgres/model/userModel';
interface AuthenticatedRequest extends Request {
    user: User; // Replace with your specific user type
  }
// Create a new comment
export const createComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId  = req.user.id; // Get the ID of the authenticated user
    let { id } = req.params; // ID of the news to comment on
    const { comment } = req.body; // The comment text
    let newsId=parseInt(id)
    // Ensure the news item exists
    const news = await newsModel.findByPk(newsId);
    if (!news) {
      return res.status(404).json({ status: 404, message: "News not found" });
    }

    // Create the comment
    const newComment = await commentModel.create({
      userId,
      newsId,
      comment
    });

    return res.status(201).json({ status: 201, comment: newComment });
  } catch (err) {
    if (err instanceof Error) {
      return res.status(500).json({ status: 500, message: err.message });
    }
    return res.status(500).json({ status: 500, message: "Unknown error occurred" });
  }
};

// List comments for a specific news item
export const listComments = async (req: Request, res: Response) => {
    try {
      let { id } = req.params;
      console.log(id)
  
      // Ensure the news item exists
      const news = await newsModel.findByPk(id);
      if (!news) {
        return res.status(404).json({ status: 404, message: "News not found" });
      }
  
      // Get comments for the news item
      const comments = await commentModel.findAll({
        where: { newsId: id } // Query by newsId, not by id
      });
  
      return res.status(200).json({ status: 200, comments });
    } catch (err) {
      if (err instanceof Error) {
        return res.status(500).json({ status: 500, message: err.message });
      }
      return res.status(500).json({ status: 500, message: "Unknown error occurred" });
    }
  };

//Update comment
export const updateComment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id; // Get the ID of the authenticated user
      const { id } = req.params; // ID of the comment to update
      const { comment } = req.body; // Updated comment text
  
      // Ensure the comment exists
      const existingComment = await commentModel.findByPk(id);
      if (!existingComment) {
        return res.status(404).json({ status: 404, message: "Comment not found" });
      }
  
      // Check if the user is authorized to update the comment
      if (existingComment.userId !== userId) {
        return res.status(403).json({ status: 403, message: "Unauthorized" });
      }
  
      // Update the comment
      await existingComment.update({ comment });
  
      return res.status(200).json({ status: 200, comment: existingComment });
    } catch (err) {
      if (err instanceof Error) {
        return res.status(500).json({ status: 500, message: err.message });
      }
      return res.status(500).json({ status: 500, message: "Unknown error occurred" });
    }
  };



  // Delete a comment
export const deleteComment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id; // Get the ID of the authenticated user
      const { id } = req.params; // ID of the comment to delete
  
      // Ensure the comment exists
      const existingComment = await commentModel.findByPk(id);
      if (!existingComment) {
        return res.status(404).json({ status: 404, message: "Comment not found" });
      }
  
      // Check if the user is authorized to delete the comment
      if (existingComment.userId !== userId) {
        return res.status(403).json({ status: 403, message: "Unauthorized" });
      }
  
      // Delete the comment
      await existingComment.destroy();
  
      return res.status(200).json({ status: 200, message: "Comment deleted successfully" });
    } catch (err) {
      if (err instanceof Error) {
        return res.status(500).json({ status: 500, message: err.message });
      }
      return res.status(500).json({ status: 500, message: "Unknown error occurred" });
    }
  };