import { Op } from '@sequelize/core';
import { Profile } from './models/Profile.js';
import { Friendship } from './models/Friendship.js';
import { Metric } from './models/Metric.js';
import { Step } from './models/Step.js';
import { Device } from './models/Device.js';
import { Calorie } from './models/Calorie.js';

export const addProfile = async (profileData) => {
  const newProfile = await Profile.create(profileData);
  return newProfile.get({ plain: true });
};

export const getProfileById = async (id) => {
  const profile = await Profile.findByPk(id, { raw: true });
  return profile;
};

export const profileExistsById = async (id) => {
  const count = await Profile.count({ where: { id } });
  return count > 0;
};

export const profileExistsByEmail = async (email) => {
  const count = await Profile.count({ where: { email } });
  return count > 0;
};

export const searchProfiles = async (query) => {
  const lowerQuery = query.toLowerCase();

  const profiles = await Profile.findAll({
    where: {
      [Op.or]: [
        { email: { [Op.like]: `%${lowerQuery}%` } },
        { first_name: { [Op.like]: `%${lowerQuery}%` } },
        { last_name: { [Op.like]: `%${lowerQuery}%` } },
      ],
    },
    attributes: ['id', 'email', 'first_name', 'last_name'],
    raw: true,
  });
  return profiles;
};

export const updateProfile = async (id, updateData) => {
  const profile = await Profile.findByPk(id);
  if (!profile) {
    return null;
  }

  const updatedProfile = await profile.update(updateData);
  return updatedProfile.get({ plain: true });
};

export const removeProfileById = async (id) => {
  const deletedRowCount = await Profile.destroy({ where: { id } });
  return deletedRowCount > 0;
};

export const addFriendship = async (friendshipData) => {
  const [friendship, created] = await Friendship.findOrCreate({
    where: {
      // order doesnt matter
      [Op.or]: [
        { userId: friendshipData.userId, friendId: friendshipData.friendId },
        { userId: friendshipData.friendId, friendId: friendshipData.userId },
      ],
    },
    defaults: friendshipData,
  });

  if (!created) {
    console.warn(
      `Friendship between ${friendshipData.userId} and ${friendshipData.friendId} already exists or was found.`,
    );

    return friendship.get({ plain: true });
  }

  return friendship.get({ plain: true });
};

export const findFriendsByUserId = async (userId) => {
  const friendships = await Friendship.findAll({
    where: {
      [Op.or]: [{ userId: userId }, { friendId: userId }],
    },
    include: [
      {
        model: Profile,
        as: 'friend', // linked by friendId
        attributes: ['id', 'email', 'first_name', 'last_name'],
      },
      {
        model: Profile,
        as: 'user', // linked by userId
        attributes: ['id', 'email', 'first_name', 'last_name'],
      },
    ],
  });

  return friendships
    .map((friendship) => {
      let actualFriendProfileInstance = null;

      // @ts-ignore
      if (friendship.userId === userId) {
        // @ts-ignore
        actualFriendProfileInstance = friendship.friend;
        // @ts-ignore
      } else if (friendship.friendId === userId) {
        // @ts-ignore
        actualFriendProfileInstance = friendship.user;
      }

      return {
        // @ts-ignore
        friendshipId: friendship.id,
        profile: actualFriendProfileInstance
          ? actualFriendProfileInstance.get({ plain: true })
          : null,
      };
    })
    .filter((f) => f.profile != null);
};

export const removeFriendshipById = async (id) => {
  const deletedRowCount = await Friendship.destroy({ where: { id } });
  return deletedRowCount > 0;
};

export const findFriendshipBetweenUsers = async (user1Id, user2Id) => {
  const friendship = await Friendship.findOne({
    where: {
      [Op.or]: [
        { userId: user1Id, friendId: user2Id },
        { userId: user2Id, friendId: user1Id },
      ],
    },
    raw: true,
  });
  return friendship;
};

export const updateFriendshipById = async (id, updateData) => {
  const friendship = await Friendship.findByPk(id);
  if (!friendship) {
    return null;
  }

  const updatedFriendship = await friendship.update(updateData);
  return updatedFriendship.get({ plain: true });
};

export const addMetric = async (userId, metricData) => {
  const newMetric = await Metric.create({
    userId,
    ...metricData,
    value: metricData.value.toString(),
    recordedAt: new Date(),
  });
  return newMetric.get({ plain: true });
};

export const findMetricsByUserId = async (
  userId,
  { metricType, limit = 20, offset = 0 },
) => {
  const where = { userId };
  if (metricType) {
    where.metricType = metricType;
  }

  const metrics = await Metric.findAll({
    where,
    order: [['recordedAt', 'DESC']],
    limit,
    offset,
    raw: true,
  });
  return metrics;
};

export const removeMetricById = async (id) => {
  const deletedRowCount = await Metric.destroy({ where: { id } });
  return deletedRowCount > 0;
};

export const updateMetricById = async (id, updateData) => {
  const metric = await Metric.findByPk(id);
  if (!metric) return null;

  const updatedMetric = await metric.update({
    ...updateData,
    value: updateData.value.toString(),
    recordedAt: new Date(),
  });
  return updatedMetric.get({ plain: true });
};

export const upsertSteps = async (userId, stepData) => {
  const [stepRecord, created] = await Step.findOrCreate({
    where: {
      userId,
      date: stepData.date,
    },
    defaults: {
      userId,
      ...stepData,
    },
  });

  if (!created) {
    await stepRecord.update({ steps: stepData.steps });
  }

  return stepRecord.get({ plain: true });
};

export const findStepsByUserAndDateRange = async (userId, start, end) => {
  const where = { userId };
  const dateWhere = {};

  if (start) {
    dateWhere[Op.gte] = start;
  }
  if (end) {
    dateWhere[Op.lte] = end;
  }
  if (Object.keys(dateWhere).length > 0) {
    where.date = dateWhere;
  }

  const steps = await Step.findAll({
    where,
    order: [['date', 'DESC']],
    raw: true,
  });
  return steps;
};

export const findStepById = async (id) => {
  const step = await Step.findByPk(id, { raw: true });
  return step;
};

export const removeStepById = async (id) => {
  const deletedRowCount = await Step.destroy({ where: { id } });
  return deletedRowCount > 0;
};

export const updateStepById = async (id, updateData) => {
  const step = await Step.findByPk(id);
  if (!step) return null;

  const updatedStep = await step.update(updateData);
  return updatedStep.get({ plain: true });
};

export const findCaloriesByUserAndDateRange = async (userId, start, end) => {
  const where = { userId };
  const dateWhere = {};
  if (start) dateWhere[Op.gte] = start;
  if (end) dateWhere[Op.lte] = end;
  if (Object.keys(dateWhere).length > 0) where.date = dateWhere;

  const calorieRecords = await Calorie.findAll({
    where,
    order: [['date', 'DESC']],
    raw: true,
  });
  return calorieRecords;
};

export const findCalorieById = async (id) => {
  const calorie = await Calorie.findByPk(id, { raw: true });
  return calorie;
};

export const removeCalorieById = async (id) => {
  const deletedRowCount = await Calorie.destroy({ where: { id } });
  return deletedRowCount > 0;
};

export const upsertCalories = async (userId, calorieData) => {
  const [calorieRecord, created] = await Calorie.findOrCreate({
    where: {
      userId,
      date: calorieData.date,
    },
    defaults: { userId, ...calorieData },
  });

  if (!created) {
    await calorieRecord.update({ calories: calorieData.calories });
  }

  return calorieRecord.get({ plain: true });
};

export const addDevice = async (userId, deviceData) => {
  const newDevice = await Device.create({
    userId,
    ...deviceData,
  });
  return newDevice.get({ plain: true });
};

export const findDevicesByUserId = async (userId) => {
  const devices = await Device.findAll({
    where: { userId },
    raw: true,
  });
  return devices;
};

export const findDeviceById = async (id) => {
  const device = await Device.findByPk(id, { raw: true });
  return device;
};

export const removeDeviceById = async (id) => {
  const deletedRowCount = await Device.destroy({ where: { id } });
  return deletedRowCount > 0;
};
