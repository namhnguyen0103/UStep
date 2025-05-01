import { Model, DataTypes, sql } from '@sequelize/core';
import { sequelize } from '../config/database.js';

export class Step extends Model {}

Step.init(
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
    steps: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'date'],
      },
    ],
  },
);
