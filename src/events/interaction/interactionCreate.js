const { Events } = require("discord.js");
const {
  continueGame,
  isHungerGamesButton
} = require("../../systems/games/hungerGamesSystem");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (isHungerGamesButton(interaction)) {
      try {
        await continueGame(interaction);
      } catch (error) {
        console.error("Error al avanzar Hunger Games:", error);

        const response = {
          content: "Ocurrio un error al avanzar la partida.",
          ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(response);
          return;
        }

        await interaction.reply(response);
      }
      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      await interaction.reply({
        content: "Ese comando no esta disponible actualmente.",
        ephemeral: true
      });
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`Error al ejecutar el comando ${interaction.commandName}:`, error);

      const response = {
        content: "Ocurrio un error al ejecutar este comando.",
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(response);
        return;
      }

      await interaction.reply(response);
    }
  }
};
