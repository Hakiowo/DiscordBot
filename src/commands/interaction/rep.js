const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const { formatDuration } = require("../../systems/economy/economySystem");
const { recordMissionEvent } = require("../../systems/missions/missionSystem");
const { rollRandomEventField } = require("../../systems/randomEvents/randomEventSystem");
const { giveReputation } = require("../../systems/reputation/reputationSystem");

module.exports = {
  category: COMMAND_CATEGORIES.INTERACTION,
  data: new SlashCommandBuilder()
    .setName("rep")
    .setDescription("Da reputacion positiva a otro usuario.")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Usuario al que quieres dar reputacion.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("motivo")
        .setDescription("Motivo de la reputacion.")
        .setRequired(false)
        .setMaxLength(120)
    ),
  async execute(interaction) {
    const targetUser = interaction.options.getUser("usuario");
    const reason = interaction.options.getString("motivo") || "Sin motivo especifico.";

    if (targetUser.bot || targetUser.id === interaction.user.id) {
      await interaction.reply({
        content: "La reputacion debe ir para otro usuario real.",
        ephemeral: true
      });
      return;
    }

    const result = await giveReputation({
      giver: interaction.user,
      target: targetUser,
      reason
    });

    if (!result.given) {
      await interaction.reply({
        content: `Ya diste reputacion a ese usuario recientemente. Vuelve en ${formatDuration(result.remainingMs)}.`,
        ephemeral: true
      });
      return;
    }

    await recordMissionEvent(interaction.user, "rep");
    const eventField = await rollRandomEventField(interaction.user);
    const embed = new EmbedBuilder()
      .setColor(0x90be6d)
      .setTitle("Reputacion entregada")
      .setDescription(`${interaction.user} dio reputacion a ${targetUser}.\nMotivo: ${reason}`)
      .addFields({
        name: "Total",
        value: `${targetUser.username} ahora tiene ${result.targetReputation.points} puntos de reputacion.`
      });

    if (eventField) {
      embed.addFields(eventField);
    }

    await interaction.reply({ embeds: [embed] });
  }
};
