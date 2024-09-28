import { Request, Response } from 'express';
import { categoryModel } from '../postgres/postgres';

// Create a new category
export const createCategory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name } = req.body;
    const category = await categoryModel.create({ name });
    return res.status(201).json(category);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// Get all categories
export const getAllCategories = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const categories = await categoryModel.findAll();
    return res.json(categories);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// Get a specific category by ID
export const getCategoryById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const category = await categoryModel.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json(category);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// Update a category
export const updateCategory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name } = req.body;
    const category = await categoryModel.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    category.name = name;
    await category.save();
    return res.status(200).json(category);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// Delete a category
export const deleteCategory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const category = await categoryModel.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    await category.destroy();
    return res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
