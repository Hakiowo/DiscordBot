const { SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const {
  MAX_PLAYERS,
  MIN_PLAYERS,
  startGame
} = require("../../systems/games/hungerGamesSystem");

module.exports = {
  category: COMMAND_CATEGORIES.GAMES,
  data: new SlashCommandBuilder()
    .setName("hungergames")
    .setDescription("Inicia una simulacion de Hunger Games por dias.")
    .addStringOption((option) =>
      option
        .setName("jugadores")
        .setDescription("Menciona usuarios o escribe nombres separados por comas.")
        .setRequired(true)
        .setMaxLength(1000)
    ),
  async execute(interaction) {
    const input = interaction.options.getString("jugadores");
    const result = await startGame(interaction, input);

    if (!result.ok && result.reason === "active") {
      await interaction.reply({
        content: "Ya hay una partida de Hunger Games activa. Terminen o cancelen esa antes de iniciar otra.",
        ephemeral: true
      });
      return;
    }

    if (!result.ok && result.reason === "not_enough_players") {
      await interaction.reply({
        content: `Necesitas al menos ${MIN_PLAYERS} participantes validos. Maximo permitido: ${MAX_PLAYERS}.`,
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      embeds: [result.embed],
      components: result.components
    });
  }
};
