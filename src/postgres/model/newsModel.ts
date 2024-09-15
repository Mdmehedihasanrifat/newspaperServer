import { DataTypes, Model, Sequelize, ModelCtor } from 'sequelize';

interface NewsAttributes {
  id?: number;
  title: string;
  description: string;
  image?: string;
  categoryId: number;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NewsInstance extends Model<NewsAttributes>, NewsAttributes {}

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
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'category',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
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
