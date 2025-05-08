import { sequelize } from './database.js';
import { Profile } from '../models/Profile.js';
import { Friendship } from '../models/Friendship.js';
import { Metric } from '../models/Metric.js';
import { Step } from '../models/Step.js';
import { Device } from '../models/Device.js';
import { Calorie } from '../models/Calorie.js';

Friendship.belongsTo(Profile, { foreignKey: 'userId', as: 'user' }); // user who initiated
Friendship.belongsTo(Profile, { foreignKey: 'friendId', as: 'friend' }); // user who was friended

Profile.hasMany(Friendship, {
  foreignKey: 'userId',
  as: 'initiatedFriendships',
  inverse: {
    as: 'user',
  },
});
Profile.hasMany(Friendship, {
  foreignKey: 'friendId',
  as: 'receivedFriendships',
  inverse: {
    as: 'friend',
  },
});

Profile.hasMany(Metric, { foreignKey: 'userId', as: 'metrics' });
Metric.belongsTo(Profile, { foreignKey: 'userId', as: 'user' });

Profile.hasMany(Step, { foreignKey: 'userId', as: 'steps' });
Step.belongsTo(Profile, { foreignKey: 'userId', as: 'user' });

Profile.hasMany(Device, { foreignKey: 'userId', as: 'devices' });
Device.belongsTo(Profile, { foreignKey: 'userId', as: 'user' });

Profile.hasMany(Calorie, { foreignKey: 'userId', as: 'calories' });
Calorie.belongsTo(Profile, { foreignKey: 'userId', as: 'user' });

export const initDatabase = async () => {
  try {
    await sequelize.sync();
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Database synchronization failed:', error);
    process.exit(1);
  }
};
