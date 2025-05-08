import { Model, DataTypes, sql } from '@sequelize/core';
import { sequelize } from '../config/database.js';

export class Calorie extends Model {}

Calorie.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: sql.uuidV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    calories: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
  },
);
