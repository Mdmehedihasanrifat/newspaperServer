import { Sequelize } from "sequelize";
import { createUserModel } from "./model/userModel";
import { createNewsModel } from "./model/newsModel";
import { createCommentModel } from "./model/commentModel";

const sequelize = new Sequelize('postgres', 'postgres', 'h1997asaN#@', {
    host: 'localhost',
    dialect: 'postgres'
  });
  

  const userModel=createUserModel(sequelize);
  const newsModel=createNewsModel(sequelize);
  const commentModel=createCommentModel(sequelize)


  userModel.hasMany(newsModel, { foreignKey: 'userId', as: 'news' });
 newsModel.belongsTo(userModel, { foreignKey: 'userId', as: 'user' });
 userModel.hasMany(commentModel, { foreignKey: 'userId' });
 commentModel.belongsTo(userModel, { foreignKey: 'userId' });

newsModel.hasMany(commentModel, { foreignKey: 'newsId' });
commentModel.belongsTo(commentModel, { foreignKey: 'newsId' });

  const connection = async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: false }); // Adjust this according to your needs
      console.log('Connection has been established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  };

  export { connection,userModel,newsModel,commentModel}