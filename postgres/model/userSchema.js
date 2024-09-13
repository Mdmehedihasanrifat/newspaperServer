import { DataTypes } from "sequelize";
export const createUserModel=(sequelize)=>{
    const User = sequelize.define('NewspaperUser', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        firstName: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        lastName: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        email: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true
        },
        password: {
          type: DataTypes.STRING(150),
          allowNull: false
        },
        profile:{
            type:DataTypes.STRING(250),
            allowNull:true
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
      return User;



}