import { DataTypes, Model, ModelCtor, Sequelize } from 'sequelize';

// Define attributes for Comment
interface CommentAttributes {
  id?: number;
  userId: number;
  newsId: number;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Extend the Sequelize Model class
interface CommentInstance extends Model<CommentAttributes>, CommentAttributes {}

// Define the Comment model
export const createCommentModel = (sequelize: Sequelize): ModelCtor<CommentInstance> => {
  const Comment = sequelize.define<CommentInstance>('Comment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users', // Ensure this matches the actual model name
        key: 'id'
      },
      onDelete: 'CASCADE' 
    },
    newsId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'News', // Ensure this matches the actual model name
        key: 'id'
      },
      onDelete: 'CASCADE' 
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    timestamps: true, // Sequelize will manage createdAt and updatedAt
    tableName: 'Comments' // Explicitly define table name
  });

  return Comment;
};
