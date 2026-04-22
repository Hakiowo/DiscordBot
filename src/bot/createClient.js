const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");

function createClient() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
  });

  client.commands = new Collection();

  return client;
}

module.exports = { createClient };
