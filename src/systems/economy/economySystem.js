const path = require("path");
const { readJsonFile, updateJsonFile } = require("../../services/jsonStorage");

const economyFilePath = path.join(__dirname, "..", "..", "..", "data", "economy.json");
const defaultEconomyData = { users: {} };

const CURRENCY_NAME = "Genial Coin";
const CURRENCY_NAME_PLURAL = "Genial Coins";
const DAILY_REWARD = 125;
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const INTERACTION_REWARD = 3;
const EIGHT_BALL_REWARD = 8;
const HUNGER_GAMES_WIN_REWARD = 175;

const SHOP_ITEMS = Object.freeze([
  {
    id: "brillo",
    name: "Brillo de perfil",
    price: 250,
    description: "Un detalle cosmetico para presumir actividad."
  },
  {
    id: "amuleto",
    name: "Amuleto de suerte",
    price: 500,
    description: "Para quienes consultan al destino con estilo."
  },
  {
    id: "corona",
    name: "Corona genial",
    price: 1200,
    description: "Un simbolo caro, simple y directo."
  }
]);

function createEmptyWallet(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.globalName || user.username,
    balance: 0,
    earned: 0,
    spent: 0,
    inventory: {},
    lastDailyAt: null,
    updatedAt: new Date().toISOString()
  };
}

function ensureWalletShape(wallet, user) {
  const normalizedWallet = wallet || createEmptyWallet(user);

  normalizedWallet.id = user.id;
  normalizedWallet.username = user.username;
  normalizedWallet.displayName = user.globalName || user.username;
  normalizedWallet.balance = normalizedWallet.balance || 0;
  normalizedWallet.earned = normalizedWallet.earned || 0;
  normalizedWallet.spent = normalizedWallet.spent || 0;
  normalizedWallet.inventory = normalizedWallet.inventory || {};
  normalizedWallet.lastDailyAt = normalizedWallet.lastDailyAt || null;
  normalizedWallet.updatedAt = new Date().toISOString();

  return normalizedWallet;
}

function formatCurrency(amount) {
  const currencyName = amount === 1 ? CURRENCY_NAME : CURRENCY_NAME_PLURAL;
  return `${amount} ${currencyName}`;
}

function getRemainingDailyMs(wallet) {
  if (!wallet.lastDailyAt) {
    return 0;
  }

  const elapsedMs = Date.now() - new Date(wallet.lastDailyAt).getTime();
  return Math.max(DAILY_COOLDOWN_MS - elapsedMs, 0);
}

function formatDuration(ms) {
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} min`;
  }

  if (minutes <= 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

async function getWallet(user) {
  const data = await readJsonFile(economyFilePath, defaultEconomyData);
  return ensureWalletShape(data.users[user.id], user);
}

async function addCoins(user, amount) {
  const updatedData = await updateJsonFile(economyFilePath, defaultEconomyData, (data) => {
    const nextData = {
      users: {
        ...data.users
      }
    };

    const wallet = ensureWalletShape(nextData.users[user.id], user);
    wallet.balance += amount;
    wallet.earned += amount;
    wallet.updatedAt = new Date().toISOString();
    nextData.users[user.id] = wallet;

    return nextData;
  });

  return updatedData.users[user.id];
}

async function claimDaily(user) {
  let result = null;

  const updatedData = await updateJsonFile(economyFilePath, defaultEconomyData, (data) => {
    const nextData = {
      users: {
        ...data.users
      }
    };

    const wallet = ensureWalletShape(nextData.users[user.id], user);
    const remainingMs = getRemainingDailyMs(wallet);

    if (remainingMs > 0) {
      result = {
        claimed: false,
        remainingMs,
        wallet
      };
      nextData.users[user.id] = wallet;
      return nextData;
    }

    wallet.balance += DAILY_REWARD;
    wallet.earned += DAILY_REWARD;
    wallet.lastDailyAt = new Date().toISOString();
    wallet.updatedAt = new Date().toISOString();
    nextData.users[user.id] = wallet;

    result = {
      claimed: true,
      reward: DAILY_REWARD,
      wallet
    };

    return nextData;
  });

  return result || {
    claimed: true,
    reward: DAILY_REWARD,
    wallet: updatedData.users[user.id]
  };
}

function getShopItems() {
  return SHOP_ITEMS;
}

function getShopItem(itemId) {
  return SHOP_ITEMS.find((item) => item.id === itemId);
}

async function buyItem(user, itemId) {
  const item = getShopItem(itemId);

  if (!item) {
    return {
      bought: false,
      reason: "not_found"
    };
  }

  let result = null;

  await updateJsonFile(economyFilePath, defaultEconomyData, (data) => {
    const nextData = {
      users: {
        ...data.users
      }
    };

    const wallet = ensureWalletShape(nextData.users[user.id], user);

    if (wallet.balance < item.price) {
      result = {
        bought: false,
        reason: "insufficient_funds",
        item,
        wallet
      };
      nextData.users[user.id] = wallet;
      return nextData;
    }

    wallet.balance -= item.price;
    wallet.spent += item.price;
    wallet.inventory[item.id] = (wallet.inventory[item.id] || 0) + 1;
    wallet.updatedAt = new Date().toISOString();
    nextData.users[user.id] = wallet;

    result = {
      bought: true,
      item,
      wallet
    };

    return nextData;
  });

  return result;
}

module.exports = {
  CURRENCY_NAME,
  CURRENCY_NAME_PLURAL,
  DAILY_REWARD,
  EIGHT_BALL_REWARD,
  HUNGER_GAMES_WIN_REWARD,
  INTERACTION_REWARD,
  addCoins,
  buyItem,
  claimDaily,
  formatCurrency,
  formatDuration,
  getShopItems,
  getWallet
};
