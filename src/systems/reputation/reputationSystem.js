const path = require("path");
const { readJsonFile, updateJsonFile } = require("../../services/jsonStorage");

const reputationFilePath = path.join(__dirname, "..", "..", "..", "data", "reputation.json");
const defaultReputationData = { users: {}, grants: {} };
const REP_COOLDOWN_MS = 12 * 60 * 60 * 1000;

function createEmptyReputation(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.globalName || user.username,
    points: 0,
    received: 0,
    given: 0,
    lastReason: null,
    updatedAt: new Date().toISOString()
  };
}

function ensureReputationShape(reputation, user) {
  const normalizedReputation = reputation || createEmptyReputation(user);

  normalizedReputation.id = user.id;
  normalizedReputation.username = user.username;
  normalizedReputation.displayName = user.globalName || user.username;
  normalizedReputation.points = normalizedReputation.points || 0;
  normalizedReputation.received = normalizedReputation.received || 0;
  normalizedReputation.given = normalizedReputation.given || 0;
  normalizedReputation.lastReason = normalizedReputation.lastReason || null;
  normalizedReputation.updatedAt = new Date().toISOString();

  return normalizedReputation;
}

function getGrantKey(giverId, targetId) {
  return `${giverId}:${targetId}`;
}

function getRemainingCooldownMs(lastGivenAt) {
  if (!lastGivenAt) {
    return 0;
  }

  const elapsedMs = Date.now() - new Date(lastGivenAt).getTime();
  return Math.max(REP_COOLDOWN_MS - elapsedMs, 0);
}

async function giveReputation({ giver, target, reason }) {
  let result = null;

  await updateJsonFile(reputationFilePath, defaultReputationData, (data) => {
    const nextData = {
      users: {
        ...data.users
      },
      grants: {
        ...data.grants
      }
    };

    const grantKey = getGrantKey(giver.id, target.id);
    const remainingMs = getRemainingCooldownMs(nextData.grants[grantKey]);

    const giverReputation = ensureReputationShape(nextData.users[giver.id], giver);
    const targetReputation = ensureReputationShape(nextData.users[target.id], target);

    if (remainingMs > 0) {
      result = {
        given: false,
        remainingMs,
        targetReputation
      };
      nextData.users[giver.id] = giverReputation;
      nextData.users[target.id] = targetReputation;
      return nextData;
    }

    giverReputation.given += 1;
    targetReputation.points += 1;
    targetReputation.received += 1;
    targetReputation.lastReason = reason || "Sin motivo especifico.";
    targetReputation.updatedAt = new Date().toISOString();
    nextData.grants[grantKey] = new Date().toISOString();
    nextData.users[giver.id] = giverReputation;
    nextData.users[target.id] = targetReputation;

    result = {
      given: true,
      targetReputation
    };

    return nextData;
  });

  return result;
}

async function getTopReputation(limit = 10) {
  const data = await readJsonFile(reputationFilePath, defaultReputationData);

  return Object.values(data.users)
    .map((reputation) =>
      ensureReputationShape(reputation, {
        id: reputation.id,
        username: reputation.username,
        globalName: reputation.displayName
      })
    )
    .sort((left, right) => right.points - left.points)
    .slice(0, limit);
}

module.exports = {
  giveReputation,
  getTopReputation
};
