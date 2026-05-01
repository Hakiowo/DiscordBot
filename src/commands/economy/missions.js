const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const { formatCurrency } = require("../../systems/economy/economySystem");
const {
  claimCompletedMissions,
  getMissionDefinitions,
  getUserMissions
} = require("../../systems/missions/missionSystem");

function buildMissionLines(userMissions, period) {
  return getMissionDefinitions()
    .filter((definition) => definition.period === period)
    .map((definition) => {
      const mission = userMissions.missions[definition.id];
      const status = mission.claimed ? "Reclamada" : `${mission.progress}/${definition.goal}`;

      return `${definition.title} - ${status}\n${definition.description}\nRecompensa: ${formatCurrency(definition.reward)}`;
    })
    .join("\n\n");
}

module.exports = {
  category: COMMAND_CATEGORIES.ECONOMY,
  data: new SlashCommandBuilder()
    .setName("missions")
    .setDescription("Consulta o reclama misiones diarias y semanales.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ver")
        .setDescription("Muestra tus misiones activas.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("claim")
        .setDescription("Reclama las misiones completadas.")
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "claim") {
      const result = await claimCompletedMissions(interaction.user);

      if (!result.claimedMissions.length) {
        await interaction.reply({
          content: "No tienes misiones completadas pendientes de reclamar.",
          ephemeral: true
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0xf9844a)
        .setTitle("Misiones reclamadas")
        .setDescription(
          `${result.claimedMissions.map((mission) => mission.title).join("\n")}\n\nGanaste ${formatCurrency(result.totalReward)}. Balance: ${formatCurrency(result.wallet.balance)}.`
        );

      await interaction.reply({ embeds: [embed] });
      return;
    }

    const userMissions = await getUserMissions(interaction.user);
    const embed = new EmbedBuilder()
      .setColor(0x277da1)
      .setTitle("Misiones")
      .addFields(
        {
          name: "Diarias",
          value: buildMissionLines(userMissions, "daily")
        },
        {
          name: "Semanales",
          value: buildMissionLines(userMissions, "weekly")
        }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
