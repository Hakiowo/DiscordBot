const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const {
  claimDaily,
  formatCurrency,
  formatDuration
} = require("../../systems/economy/economySystem");
const { recordMissionEvent } = require("../../systems/missions/missionSystem");
const { rollRandomEventField } = require("../../systems/randomEvents/randomEventSystem");

module.exports = {
  category: COMMAND_CATEGORIES.ECONOMY,
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Reclama tu recompensa diaria de Genial Coins."),
  async execute(interaction) {
    const result = await claimDaily(interaction.user);

    if (!result.claimed) {
      await interaction.reply({
        content: `Ya reclamaste tu daily. Vuelve en ${formatDuration(result.remainingMs)}.`,
        ephemeral: true
      });
      return;
    }

    await recordMissionEvent(interaction.user, "daily");
    const eventField = await rollRandomEventField(interaction.user);
    const embed = new EmbedBuilder()
      .setColor(0x43aa8b)
      .setTitle("Daily reclamado")
      .setDescription(
        `Recibiste ${formatCurrency(result.reward)}.\nBalance actual: ${formatCurrency(result.wallet.balance)}.`
      );

    if (eventField) {
      embed.addFields(eventField);
    }

    await interaction.reply({ embeds: [embed] });
  }
};
