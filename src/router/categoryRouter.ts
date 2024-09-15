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
categoryRouter.post('/',authMiddleware, createCategory);

// Route to get all categories
categoryRouter.get('/', authMiddleware,getAllCategories);

// Route to get a specific category by ID
categoryRouter.get('/:id',authMiddleware, getCategoryById);

// Route to update a category by ID
categoryRouter.put('/:id',authMiddleware, updateCategory);

// Route to delete a category by ID
categoryRouter.delete('/:id',authMiddleware, deleteCategory);

export default categoryRouter;
