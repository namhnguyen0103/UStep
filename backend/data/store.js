import { randomUUID } from "crypto";

let profiles = []; // { id, first_name, last_name, email, created_at, updated_at }
let friendships = []; // { id, userId, friendId, created_at }
let metrics = []; // { id, userId, metricType, value, recordedAt }
let steps = []; // { id, userId, date, steps, createdAt }
let devices = []; // { id, userId, deviceName, deviceType, createdAt }

const findProfileById = (id) => profiles.find((p) => p.id === id);
const findProfileByEmail = (email) => profiles.find((p) => p.email === email);

const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

export const addProfile = (profileData) => {
  const now = new Date();
  const newProfile = {
    ...profileData,
    created_at: now,
    updated_at: now,
  };
  profiles.push(newProfile);
  return deepCopy(newProfile);
};

export const getProfileById = (id) => {
  const profile = findProfileById(id);
  return profile ? deepCopy(profile) : null;
};

export const profileExistsById = (id) => {
  return !!findProfileById(id);
};

export const profileExistsByEmail = (email) => {
  return !!findProfileByEmail(email);
};

export const searchProfiles = (query) => {
  const lowerQuery = query.toLowerCase();
  return deepCopy(
    profiles
      .filter(
        (p) =>
          p.email.toLowerCase().includes(lowerQuery) ||
          (p.first_name && p.first_name.toLowerCase().includes(lowerQuery)) ||
          (p.last_name && p.last_name.toLowerCase().includes(lowerQuery))
      )
      .map((p) => ({
        id: p.id,
        email: p.email,
        first_name: p.first_name,
        last_name: p.last_name,
      }))
  );
};

export const updateProfile = (id, updateData) => {
  const index = profiles.findIndex((p) => p.id === id);
  if (index === -1) return null;
  profiles[index] = {
    ...profiles[index],
    ...updateData,
    updated_at: new Date(),
  };
  return deepCopy(profiles[index]);
};

export const addFriendship = (friendshipData) => {
  const exists = friendships.some(
    (f) =>
      (f.userId === friendshipData.userId &&
        f.friendId === friendshipData.friendId) ||
      (f.userId === friendshipData.friendId &&
        f.friendId === friendshipData.userId)
  );
  if (exists) {
    console.warn(
      `Friendship between ${friendshipData.userId} and ${friendshipData.friendId} already exists.`
    );
    return null;
  }

  const newFriendship = {
    id: randomUUID(),
    ...friendshipData,
    created_at: new Date(),
  };
  friendships.push(newFriendship);
  return deepCopy(newFriendship);
};

export const findFriendsByUserId = (userId) => {
  const relatedFriendships = friendships.filter(
    (f) => f.userId === userId || f.friendId === userId
  );

  return deepCopy(
    relatedFriendships
      .map((friendship) => {
        const friendId =
          friendship.userId === userId
            ? friendship.friendId
            : friendship.userId;
        const friendProfile = findProfileById(friendId);

        return {
          friendship: { id: friendship.id },
          profile: friendProfile,
        };
      })
      .filter((item) => item.profile)
  );
};

export const removeFriendshipById = (id) => {
  const index = friendships.findIndex((f) => f.id === id);
  if (index > -1) {
    friendships.splice(index, 1);
    return true;
  }
  return false;
};

export const findFriendshipBetweenUsers = (user1Id, user2Id) => {
  const friendship = friendships.find(
    (f) =>
      (f.userId === user1Id && f.friendId === user2Id) ||
      (f.userId === user2Id && f.friendId === user1Id)
  );
  return friendship ? deepCopy(friendship) : null;
};

export const addMetric = (userId, metricData) => {
  const newMetric = {
    id: randomUUID(),
    userId,
    ...metricData,
    value: String(metricData.value),
    recordedAt: new Date(),
  };
  metrics.push(newMetric);
  return deepCopy(newMetric);
};

export const findMetricsByUserId = (
  userId,
  { metricType, limit = 20, offset = 0 }
) => {
  let userMetrics = metrics.filter((m) => m.userId === userId);

  if (metricType) {
    userMetrics = userMetrics.filter((m) => m.metricType === metricType);
  }

  userMetrics.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());

  return deepCopy(userMetrics.slice(offset, offset + limit));
};

export const upsertSteps = (userId, stepData) => {
  const existingIndex = steps.findIndex(
    (s) => s.userId === userId && s.date === stepData.date
  );

  if (existingIndex > -1) {
    steps[existingIndex] = {
      ...steps[existingIndex],
      steps: stepData.steps,
      updatedAt: new Date(),
    };
    return deepCopy(steps[existingIndex]);
  } else {
    const newStepRecord = {
      id: randomUUID(),
      userId,
      ...stepData,
      createdAt: new Date(),
    };
    steps.push(newStepRecord);
    return deepCopy(newStepRecord);
  }
};

export const findStepsByUserAndDateRange = (userId, start, end) => {
  let userSteps = steps.filter((s) => s.userId === userId);

  if (start) {
    userSteps = userSteps.filter((s) => s.date >= start);
  }
  if (end) {
    userSteps = userSteps.filter((s) => s.date <= end);
  }

  // sort by date descending
  userSteps.sort((a, b) => b.date.localeCompare(a.date));

  return deepCopy(userSteps);
};

export const removeMetricById = (id) => {
  const index = metrics.findIndex((m) => m.id === id);
  if (index > -1) {
    metrics.splice(index, 1);
    return true;
  }
  return false;
};

export const findStepById = (id) => {
  const step = steps.find((s) => s.id === id);
  return step ? deepCopy(step) : null;
};

export const removeStepById = (id) => {
  const index = steps.findIndex((s) => s.id === id);
  if (index > -1) {
    steps.splice(index, 1);
    return true;
  }
  return false;
};

// Add a new device
export const addDevice = (userId, deviceData) => {
  const newDevice = {
    id: randomUUID(),
    userId,
    ...deviceData,
    createdAt: new Date(),
  };
  devices.push(newDevice);
  return deepCopy(newDevice);
};

// Find all devices for a specific user
export const findDevicesByUserId = (userId) => {
  return deepCopy(devices.filter((d) => d.userId === userId));
};

// Find a specific device by its ID
export const findDeviceById = (id) => {
  const device = devices.find((d) => d.id === id);
  return device ? deepCopy(device) : null;
};

// Remove a device by its ID
export const removeDeviceById = (id) => {
  const index = devices.findIndex((d) => d.id === id);
  if (index > -1) {
    devices.splice(index, 1);
    return true;
  }
  return false;
};