import { DataTypes, Model, Sequelize, ModelCtor, Optional } from 'sequelize';

// Visitor Model
interface VisitorAttributes {
  id: number;
  ip: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VisitorCreationAttributes extends Optional<VisitorAttributes, 'id'> {}

interface VisitorInstance extends Model<VisitorAttributes, VisitorCreationAttributes>, VisitorAttributes {}

export const createVisitorModel = (sequelize: Sequelize): ModelCtor<VisitorInstance> => {
  return sequelize.define<VisitorInstance>('Visitor', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ip: {
      type: DataTypes.STRING,
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
  });
};
