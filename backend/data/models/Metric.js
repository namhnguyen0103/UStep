import { Model, DataTypes, sql } from '@sequelize/core';
import { sequelize } from '../config/database.js';

export class Metric extends Model {}

Metric.init(
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
    metricType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
  },
);
