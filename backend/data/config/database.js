import { Sequelize } from '@sequelize/core';
import { SqliteDialect } from '@sequelize/sqlite3';
import path from 'path';

export const sequelize = new Sequelize({
  dialect: SqliteDialect,
  storage: path.join(__dirname, '../../.storage/database.sqlite'),
});
