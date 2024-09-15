import { DataTypes, Model, Sequelize, ModelCtor } from 'sequelize';

// Define attributes for Category
interface CategoryAttributes {
  id?: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Extend the Sequelize Model class for Category
interface CategoryInstance extends Model<CategoryAttributes>, CategoryAttributes {}

// Define the Category model
export const createCategoryModel = (sequelize: Sequelize): ModelCtor<CategoryInstance> => {
  const Category = sequelize.define<CategoryInstance>('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
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
    tableName: 'Categories' // Explicitly define table name
  });

  return Category;
};
