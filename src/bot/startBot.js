const { createClient } = require("./createClient");
const { loadCommands } = require("../handlers/loadCommands");
const { loadEvents } = require("../handlers/loadEvents");
const { env } = require("../config/env");

async function startBot() {
  const client = createClient();

  try {
    await loadCommands(client);
    await loadEvents(client);
    await client.login(env.DISCORD_TOKEN);
  } catch (error) {
    console.error("Error al iniciar BSG:", error);
    process.exit(1);
  }
}

module.exports = { startBot };
