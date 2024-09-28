import { DataTypes, Model, ModelCtor, Sequelize } from "sequelize";

interface VisitorViewAttributes {
    id?: number;
    visitorId: number;
    newsId: number;
    viewCount: number;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  interface VisitorViewInstance extends Model<VisitorViewAttributes>, VisitorViewAttributes {}
  
  export const createVisitorViewModel = (sequelize: Sequelize): ModelCtor<VisitorViewInstance> => {
    return sequelize.define<VisitorViewInstance>('VisitorView', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      visitorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Visitors',
          key: 'id'
        }
      },
      newsId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'News',
          key: 'id'
        }
      },
      viewCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
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
  };
  