const path = require("path");
const { readJavaScriptFiles } = require("../utils/readJavaScriptFiles");

async function loadCommands(client) {
  const commandsPath = path.join(__dirname, "..", "commands");
  const commandFiles = await readJavaScriptFiles(commandsPath);

  for (const filePath of commandFiles) {
    const command = require(filePath);

    if (!command || !command.data || typeof command.execute !== "function") {
      continue;
    }

    client.commands.set(command.data.name, command);
  }
}

module.exports = { loadCommands };
