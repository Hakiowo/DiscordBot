const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const {
  claimDaily,
  formatCurrency,
  formatDuration
} = require("../../systems/economy/economySystem");
const { recordMissionEvent } = require("../../systems/missions/missionSystem");
const { rollRandomEventField } = require("../../systems/randomEvents/randomEventSystem");
const { grantHakiPassRole } = require("../../utils/grantHakiPassRole");

module.exports = {
  category: COMMAND_CATEGORIES.ECONOMY,
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Reclama tu recompensa diaria de Haki Coins."),
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
    const roleResult = result.bonusItem ? await grantHakiPassRole(interaction) : null;
    const embed = new EmbedBuilder()
      .setColor(0x43aa8b)
      .setTitle("Daily reclamado")
      .setDescription(
        `Recibiste ${formatCurrency(result.reward)}.\nBalance actual: ${formatCurrency(result.wallet.balance)}.`
      );

    if (result.bonusItem) {
      embed
        .setColor(0xf9c74f)
        .addFields({
          name: "*** HakiPass desbloqueado ***",
          value: [
            "Felicidades obtuviste el HakiPass.",
            "No hace nada pero ahi tienes.",
            roleResult?.granted
              ? `Rol otorgado: ${roleResult.role}`
              : "No pude otorgar el rol HakiPass. Revisa permisos y jerarquia de roles."
          ].join("\n")
        });
    }

    if (eventField) {
      embed.addFields(eventField);
    }

    await interaction.reply({ embeds: [embed] });
  }
};
