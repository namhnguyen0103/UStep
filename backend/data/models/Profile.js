import { Model, DataTypes, sql } from '@sequelize/core';
import { sequelize } from '../config/database.js';

export class Profile extends Model {}

Profile.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: sql.uuidV4,
    },
    first_name: {
      type: DataTypes.STRING,
    },
    last_name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Profile',
  },
);
