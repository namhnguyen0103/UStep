import { Model, DataTypes, sql } from '@sequelize/core';
import { sequelize } from '../config/database.js';

export class Friendship extends Model {}

Friendship.init(
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
    friendId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'friendId'],
      },
    ],
  },
);
