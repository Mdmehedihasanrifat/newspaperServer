import { Router } from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} from '../controller/categoryController';
import authMiddleware from '../authenticate/authenticate';

const categoryRouter = Router();

// Route to create a new category
categoryRouter.post('/', createCategory);

// Route to get all categories
categoryRouter.get('/', getAllCategories);

// Route to get a specific category by ID
categoryRouter.get('/:id',getCategoryById);

// Route to update a category by ID
categoryRouter.put('/:id', updateCategory);

// Route to delete a category by ID
categoryRouter.delete('/:id',deleteCategory);

export default categoryRouter;
