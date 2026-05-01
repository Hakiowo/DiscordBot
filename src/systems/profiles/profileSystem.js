const path = require("path");
const { INTERACTION_DEFINITIONS } = require("../../config/interactionTypes");
const { readJsonFile, updateJsonFile } = require("../../services/jsonStorage");

const profilesFilePath = path.join(__dirname, "..", "..", "..", "data", "profiles.json");
const defaultProfilesData = { users: {} };

function createEmptyStats() {
  const stats = {};

  for (const interactionType of Object.keys(INTERACTION_DEFINITIONS)) {
    stats[interactionType] = 0;
  }

  return stats;
}

function createEmptyProfile(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.globalName || user.username,
    sent: createEmptyStats(),
    received: createEmptyStats(),
    totals: {
      sent: 0,
      received: 0
    },
    updatedAt: new Date().toISOString()
  };
}

function ensureProfileShape(profile, user) {
  const normalizedProfile = profile || createEmptyProfile(user);

  normalizedProfile.id = user.id;
  normalizedProfile.username = user.username;
  normalizedProfile.displayName = user.globalName || user.username;
  normalizedProfile.sent = normalizedProfile.sent || {};
  normalizedProfile.received = normalizedProfile.received || {};
  normalizedProfile.totals = normalizedProfile.totals || { sent: 0, received: 0 };

  for (const interactionType of Object.keys(INTERACTION_DEFINITIONS)) {
    normalizedProfile.sent[interactionType] = normalizedProfile.sent[interactionType] || 0;
    normalizedProfile.received[interactionType] = normalizedProfile.received[interactionType] || 0;
  }

  normalizedProfile.updatedAt = new Date().toISOString();

  return normalizedProfile;
}

async function recordInteraction({ actor, target, type }) {
  const updatedData = await updateJsonFile(profilesFilePath, defaultProfilesData, (data) => {
    const nextData = {
      users: {
        ...data.users
      }
    };

    const actorProfile = ensureProfileShape(nextData.users[actor.id], actor);
    const targetProfile = ensureProfileShape(nextData.users[target.id], target);

    actorProfile.sent[type] += 1;
    actorProfile.totals.sent += 1;

    targetProfile.received[type] += 1;
    targetProfile.totals.received += 1;

    nextData.users[actor.id] = actorProfile;
    nextData.users[target.id] = targetProfile;

    return nextData;
  });

  return {
    actorProfile: updatedData.users[actor.id],
    targetProfile: updatedData.users[target.id]
  };
}

async function getProfile(user) {
  const data = await readJsonFile(profilesFilePath, defaultProfilesData);
  return ensureProfileShape(data.users[user.id], user);
}

function getTopProfilesByMetric(profiles, metric, limit) {
  return profiles
    .sort((leftProfile, rightProfile) => rightProfile.totals[metric] - leftProfile.totals[metric])
    .slice(0, limit);
}

async function getTopProfiles(metric = "sent", limit = 10) {
  const data = await readJsonFile(profilesFilePath, defaultProfilesData);
  const profiles = Object.values(data.users).map((profile) =>
    ensureProfileShape(profile, {
      id: profile.id,
      username: profile.username,
      globalName: profile.displayName
    })
  );

  return getTopProfilesByMetric(profiles, metric, limit);
}

module.exports = {
  getProfile,
  getTopProfiles,
  recordInteraction
};
