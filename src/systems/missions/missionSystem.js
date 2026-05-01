const path = require("path");
const { addCoins } = require("../economy/economySystem");
const { readJsonFile, updateJsonFile } = require("../../services/jsonStorage");

const missionsFilePath = path.join(__dirname, "..", "..", "..", "data", "missions.json");
const defaultMissionsData = { users: {} };

const MISSION_DEFINITIONS = Object.freeze([
  {
    id: "daily_interactions",
    period: "daily",
    title: "Saluda al servidor",
    description: "Usa 3 comandos de interaccion.",
    goal: 3,
    reward: 45,
    eventType: "interaction"
  },
  {
    id: "daily_oracle",
    period: "daily",
    title: "Consulta al destino",
    description: "Usa /8ball 2 veces.",
    goal: 2,
    reward: 35,
    eventType: "8ball"
  },
  {
    id: "daily_rep",
    period: "daily",
    title: "Reconoce a alguien",
    description: "Da reputacion a otro usuario.",
    goal: 1,
    reward: 50,
    eventType: "rep"
  },
  {
    id: "weekly_daily",
    period: "weekly",
    title: "Constancia genial",
    description: "Reclama /daily 5 veces.",
    goal: 5,
    reward: 250,
    eventType: "daily"
  },
  {
    id: "weekly_activity",
    period: "weekly",
    title: "Presencia notable",
    description: "Completa 15 acciones sociales o divertidas.",
    goal: 15,
    reward: 300,
    eventTypes: ["interaction", "8ball", "rep", "hungergames"]
  }
]);

function getDailyKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getWeekKey(date = new Date()) {
  const currentDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = currentDate.getUTCDay() || 7;
  currentDate.setUTCDate(currentDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((currentDate - yearStart) / 86400000) + 1) / 7);

  return `${currentDate.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function getPeriodKey(period) {
  return period === "weekly" ? getWeekKey() : getDailyKey();
}

function createMissionProgress(definition) {
  return {
    progress: 0,
    claimed: false,
    periodKey: getPeriodKey(definition.period)
  };
}

function createEmptyUserMissions(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.globalName || user.username,
    missions: {},
    updatedAt: new Date().toISOString()
  };
}

function ensureUserMissionsShape(userMissions, user) {
  const normalizedUserMissions = userMissions || createEmptyUserMissions(user);

  normalizedUserMissions.id = user.id;
  normalizedUserMissions.username = user.username;
  normalizedUserMissions.displayName = user.globalName || user.username;
  normalizedUserMissions.missions = normalizedUserMissions.missions || {};

  for (const definition of MISSION_DEFINITIONS) {
    const currentProgress = normalizedUserMissions.missions[definition.id];
    const currentPeriodKey = getPeriodKey(definition.period);

    if (!currentProgress || currentProgress.periodKey !== currentPeriodKey) {
      normalizedUserMissions.missions[definition.id] = createMissionProgress(definition);
    }
  }

  normalizedUserMissions.updatedAt = new Date().toISOString();

  return normalizedUserMissions;
}

async function getUserMissions(user) {
  const data = await readJsonFile(missionsFilePath, defaultMissionsData);
  return ensureUserMissionsShape(data.users[user.id], user);
}

async function recordMissionEvent(user, eventType) {
  await updateJsonFile(missionsFilePath, defaultMissionsData, (data) => {
    const nextData = {
      users: {
        ...data.users
      }
    };
    const userMissions = ensureUserMissionsShape(nextData.users[user.id], user);

    for (const definition of MISSION_DEFINITIONS) {
      const eventTypes = definition.eventTypes || [definition.eventType];
      const matchesEvent = eventTypes.includes(eventType);

      if (!matchesEvent) {
        continue;
      }

      const mission = userMissions.missions[definition.id];
      mission.progress = Math.min(mission.progress + 1, definition.goal);
    }

    userMissions.updatedAt = new Date().toISOString();
    nextData.users[user.id] = userMissions;

    return nextData;
  });
}

async function claimCompletedMissions(user) {
  let result = null;

  await updateJsonFile(missionsFilePath, defaultMissionsData, async (data) => {
    const nextData = {
      users: {
        ...data.users
      }
    };
    const userMissions = ensureUserMissionsShape(nextData.users[user.id], user);
    const claimedMissions = [];
    let totalReward = 0;

    for (const definition of MISSION_DEFINITIONS) {
      const mission = userMissions.missions[definition.id];

      if (mission.claimed || mission.progress < definition.goal) {
        continue;
      }

      mission.claimed = true;
      totalReward += definition.reward;
      claimedMissions.push(definition);
    }

    userMissions.updatedAt = new Date().toISOString();
    nextData.users[user.id] = userMissions;

    result = {
      claimedMissions,
      totalReward,
      userMissions
    };

    return nextData;
  });

  if (result.totalReward > 0) {
    result.wallet = await addCoins(user, result.totalReward);
  }

  return result;
}

function getMissionDefinitions() {
  return MISSION_DEFINITIONS;
}

module.exports = {
  claimCompletedMissions,
  getMissionDefinitions,
  getUserMissions,
  recordMissionEvent
};
