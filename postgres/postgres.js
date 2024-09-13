import { Sequelize } from 'sequelize';
import { createUserModel } from './model/userSchema.js';

// Use PostgreSQL or MySQL consistently
const sequelize = new Sequelize('postgres', 'postgres', 'h1997asaN#@', {
  host: 'localhost',
  dialect: 'postgres'
});

// Define models
const userModel=createUserModel(sequelize);
const connection = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: false }); // Adjust this according to your needs
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

export { connection,userModel };
