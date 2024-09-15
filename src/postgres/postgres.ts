import { Sequelize } from "sequelize";
import { createUserModel } from "./model/userModel";
import { createNewsModel } from "./model/newsModel";
import { createCommentModel } from "./model/commentModel";
import { createCategoryModel } from "./model/categoryModel";
import { createCategoryNewsModel } from "./model/categoryNewsModel";

const sequelize = new Sequelize('postgres', 'postgres', 'h1997asaN#@', {
    host: 'localhost',
    dialect: 'postgres'
  });
  

  const userModel=createUserModel(sequelize);
  const newsModel=createNewsModel(sequelize);
  const commentModel=createCommentModel(sequelize);
  const categoryModel=createCategoryModel(sequelize);
  const categoryNewsModel=createCategoryNewsModel(sequelize);

// Associations between User, News, and Comment models
userModel.hasMany(newsModel, { foreignKey: 'userId', as: 'news', onDelete: 'CASCADE' });
newsModel.belongsTo(userModel, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });

userModel.hasMany(commentModel, { foreignKey: 'userId', onDelete: 'CASCADE' });
commentModel.belongsTo(userModel, { foreignKey: 'userId', onDelete: 'CASCADE' });

newsModel.hasMany(commentModel, { foreignKey: 'newsId', onDelete: 'CASCADE' });
commentModel.belongsTo(newsModel, { foreignKey: 'newsId', onDelete: 'CASCADE' });
newsModel.belongsToMany(categoryModel, { through: categoryNewsModel, foreignKey: 'newsId', as: 'categories' });
categoryModel.belongsToMany(newsModel, { through: categoryNewsModel, foreignKey: 'categoryId', as: 'news' });


  const connection = async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true }); // Adjust this according to your needs
      console.log('Connection has been established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  };

  export { connection,userModel,newsModel,commentModel,categoryModel,categoryNewsModel}