import { DataTypes, Model, Sequelize, ModelCtor, Optional } from 'sequelize';
import { categoryModel } from '../postgres';
interface NewsAttributes {
  id?: number;
  title: string;
  description: string;
  image?: string;
//   categoryId: number;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NewsCreationAttributes extends Optional<NewsAttributes, 'id'> {}

interface NewsInstance extends Model<NewsAttributes, NewsCreationAttributes>, NewsAttributes {
    addCategories: (categoryIds: number[]) => Promise<void>; // Declare addCategories method
    setCategories: (categoryIds: number[]) => Promise<void>;
    // Assuming categoryModel is imported
  }

export const createNewsModel = (sequelize: Sequelize): ModelCtor<NewsInstance> => {
  const News = sequelize.define<NewsInstance>('News', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
        // categoryId: {
    //   type: DataTypes.INTEGER,
    //   references: {
    //     model: 'category',
    //     key: 'id'
    //   }
    // },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
      , onDelete: 'CASCADE' 
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  return News;
};
