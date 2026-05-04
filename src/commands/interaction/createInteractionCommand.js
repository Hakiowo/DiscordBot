const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const {
  INTERACTION_REWARD,
  addCoins,
  formatCurrency
} = require("../../systems/economy/economySystem");
const { recordMissionEvent } = require("../../systems/missions/missionSystem");
const { rollRandomEventField } = require("../../systems/randomEvents/randomEventSystem");

function createInteractionCommand(definition, { getInteractionGif, recordInteraction }) {
  return {
    category: COMMAND_CATEGORIES.INTERACTION,
    data: new SlashCommandBuilder()
      .setName(definition.name)
      .setDescription(definition.description)
      .addUserOption((option) =>
        option
          .setName("usuario")
          .setDescription("Usuario con el que quieres interactuar.")
          .setRequired(true)
    ),
    async execute(interaction) {
      const targetUser = interaction.options.getUser("usuario");

      if (!targetUser) {
        await interaction.reply({
          content: "Debes indicar un usuario valido para este comando.",
          ephemeral: true
        });
        return;
      }

      if (targetUser.bot) {
        await interaction.reply({
          content: "Ese comando esta pensado para interactuar con otros usuarios, no con bots.",
          ephemeral: true
        });
        return;
      }

      if (targetUser.id === interaction.user.id) {
        await interaction.reply({
          content: "Ese comando necesita otro usuario; no puedes usarlo contigo mismo.",
          ephemeral: true
        });
        return;
      }

      const { actorProfile } = await recordInteraction({
        actor: interaction.user,
        target: targetUser,
        type: definition.name
      });
      const wallet = await addCoins(interaction.user, INTERACTION_REWARD);
      await recordMissionEvent(interaction.user, "interaction");
      const eventField = await rollRandomEventField(interaction.user);

      const interactionImage = await getInteractionGif(definition);
      const gifUrl = typeof interactionImage === "string" ? interactionImage : interactionImage?.url;
      const files = typeof interactionImage === "object" && interactionImage?.files ? interactionImage.files : [];
      const embed = new EmbedBuilder()
        .setColor(definition.color)
        .setDescription(
          `${interaction.user} ${definition.responseText} ${targetUser}.\nTotal de /${definition.name}: ${actorProfile.sent[definition.name]}.\nGanaste ${formatCurrency(INTERACTION_REWARD)}. Balance: ${formatCurrency(wallet.balance)}.`
        );

      if (gifUrl) {
        embed.setImage(gifUrl);
      }

      if (eventField) {
        embed.addFields(eventField);
      }

      await interaction.reply({
        content: `${targetUser}`,
        embeds: [embed],
        files,
        allowedMentions: {
          users: [targetUser.id]
        }
      });
    }
  };
}

module.exports = { createInteractionCommand };
