const dotenv = require("dotenv");

dotenv.config();

const requiredEnvVars = ["DISCORD_TOKEN", "DISCORD_CLIENT_ID"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Falta la variable de entorno requerida: ${envVar}`);
  }
}

const env = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID || null
};

module.exports = { env };
