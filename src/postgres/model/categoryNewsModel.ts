import { DataTypes, Model, Sequelize, ModelCtor } from 'sequelize';

// Define attributes for the join table
interface CategoryNewsAttributes {
  id?: number;
  newsId: number;
  categoryId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Extend the Sequelize Model class for CategoryNews
interface CategoryNewsInstance extends Model<CategoryNewsAttributes>, CategoryNewsAttributes {}

// Define the join table CategoryNews model
export const createCategoryNewsModel = (sequelize: Sequelize): ModelCtor<CategoryNewsInstance> => {
  const CategoryNews = sequelize.define<CategoryNewsInstance>('CategoryNews', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    newsId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'News',  // Refers to the News model
        key: 'id'
      },
      onDelete: 'CASCADE'  // Cascading delete if News is deleted
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Categories',  // Refers to the Category model
        key: 'id'
      },
      onDelete: 'CASCADE'  // Cascading delete if Category is deleted
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'CategoryNews'  // Explicitly define table name
  });

  return CategoryNews;
};
