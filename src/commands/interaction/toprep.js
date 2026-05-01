const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const { getTopReputation } = require("../../systems/reputation/reputationSystem");

function buildLeaderboardLines(reputations) {
  if (!reputations.length) {
    return "Todavia no hay reputacion registrada.";
  }

  return reputations
    .map((reputation, index) => `${index + 1}. ${reputation.displayName} - ${reputation.points}`)
    .join("\n");
}

module.exports = {
  category: COMMAND_CATEGORIES.INTERACTION,
  data: new SlashCommandBuilder()
    .setName("toprep")
    .setDescription("Muestra el ranking de reputacion del servidor."),
  async execute(interaction) {
    const reputations = await getTopReputation(10);
    const embed = new EmbedBuilder()
      .setColor(0x4d908e)
      .setTitle("Top reputacion")
      .setDescription(buildLeaderboardLines(reputations));

    await interaction.reply({ embeds: [embed] });
  }
};
