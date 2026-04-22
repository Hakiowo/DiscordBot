const path = require("path");
const { REST, Routes } = require("discord.js");
const { env } = require("../config/env");
const { readJavaScriptFiles } = require("../utils/readJavaScriptFiles");

async function getCommandPayload() {
  const commandsPath = path.join(__dirname, "..", "commands");
  const commandFiles = await readJavaScriptFiles(commandsPath);

  return commandFiles
    .map((filePath) => require(filePath))
    .filter((command) => command && command.data)
    .map((command) => command.data.toJSON());
}

async function registerCommands() {
  const commands = await getCommandPayload();
  const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

  if (env.DISCORD_GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID),
      { body: commands }
    );

    console.log(`Comandos registrados en el servidor ${env.DISCORD_GUILD_ID}`);
    return;
  }

  await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
    body: commands
  });

  console.log("Comandos globales registrados correctamente");
}

registerCommands().catch((error) => {
  console.error("No se pudieron registrar los comandos:", error);
  process.exit(1);
});
