const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const { getTopProfiles } = require("../../systems/profiles/profileSystem");

const METRIC_SENT = "sent";
const METRIC_RECEIVED = "received";

function buildLeaderboardLines(profiles, metric) {
  if (!profiles.length) {
    return "Todavia no hay interacciones registradas.";
  }

  return profiles
    .map((profile, index) => {
      const total = profile.totals[metric];
      return `${index + 1}. ${profile.displayName} - ${total}`;
    })
    .join("\n");
}

module.exports = {
  category: COMMAND_CATEGORIES.INTERACTION,
  data: new SlashCommandBuilder()
    .setName("topinteractions")
    .setDescription("Muestra el ranking de interacciones del servidor.")
    .addStringOption((option) =>
      option
        .setName("criterio")
        .setDescription("Que ranking quieres ver.")
        .setRequired(false)
        .addChoices(
          { name: "Enviadas", value: METRIC_SENT },
          { name: "Recibidas", value: METRIC_RECEIVED }
        )
    ),
  async execute(interaction) {
    const metric = interaction.options.getString("criterio") || METRIC_SENT;
    const profiles = await getTopProfiles(metric, 10);
    const metricLabel = metric === METRIC_RECEIVED ? "recibidas" : "enviadas";

    const embed = new EmbedBuilder()
      .setColor(metric === METRIC_RECEIVED ? 0xf28482 : 0x84a59d)
      .setTitle(`Top de interacciones ${metricLabel}`)
      .setDescription(buildLeaderboardLines(profiles, metric));

    await interaction.reply({ embeds: [embed] });
  }
};
