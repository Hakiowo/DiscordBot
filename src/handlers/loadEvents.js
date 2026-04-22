const path = require("path");
const { readJavaScriptFiles } = require("../utils/readJavaScriptFiles");

async function loadEvents(client) {
  const eventsPath = path.join(__dirname, "..", "events");
  const eventFiles = await readJavaScriptFiles(eventsPath);

  for (const filePath of eventFiles) {
    const event = require(filePath);

    if (!event || !event.name || typeof event.execute !== "function") {
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
      continue;
    }

    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

module.exports = { loadEvents };
