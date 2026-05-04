const { Events } = require("discord.js");
const { BOT_PREFIX } = require("../../config/constants");
const { createMessageCommandInteraction } = require("../../utils/createMessageCommandInteraction");

module.exports = {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (message.author.bot || !message.content.startsWith(BOT_PREFIX)) {
      return;
    }

    const withoutPrefix = message.content.slice(BOT_PREFIX.length).trim();

    if (!withoutPrefix) {
      return;
    }

    const [commandNameInput, ...args] = withoutPrefix.split(/\s+/);
    const commandName = commandNameInput.toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) {
      return;
    }

    const rawArgs = withoutPrefix.slice(commandNameInput.length).trim();
    const interaction = createMessageCommandInteraction({
      message,
      commandName,
      command,
      args,
      rawArgs
    });

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`Error al ejecutar el comando con prefijo ${commandName}:`, error);

      const response = {
        content: "Ocurrio un error al ejecutar este comando."
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(response);
        return;
      }

      await interaction.reply(response);
    }
  }
};
