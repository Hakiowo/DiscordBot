const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const { INTERACTION_DEFINITIONS } = require("../../config/interactionTypes");
const { getProfile } = require("../../systems/profiles/profileSystem");

function getFavoriteInteraction(stats) {
  let favoriteDefinition = null;
  let favoriteCount = 0;

  for (const definition of Object.values(INTERACTION_DEFINITIONS)) {
    const currentCount = stats[definition.name] || 0;

    if (currentCount > favoriteCount) {
      favoriteDefinition = definition;
      favoriteCount = currentCount;
    }
  }

  if (!favoriteDefinition) {
    return "Sin datos";
  }

  return `${favoriteDefinition.actionLabel}: ${favoriteCount}`;
}

function buildStatsLines(stats) {
  return Object.values(INTERACTION_DEFINITIONS)
    .map((definition) => `${definition.actionLabel}: ${stats[definition.name] || 0}`)
    .join("\n");
}

module.exports = {
  category: COMMAND_CATEGORIES.INTERACTION,
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Muestra las estadisticas de interaccion de un usuario.")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Usuario del que deseas ver el perfil.")
        .setRequired(false)
    ),
  async execute(interaction) {
    const targetUser = interaction.options.getUser("usuario") || interaction.user;
    const profile = await getProfile(targetUser);

    const embed = new EmbedBuilder()
      .setTitle(`Perfil de ${profile.displayName}`)
      .setColor(0x57f287)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name: "Totales",
          value: `Enviadas: ${profile.totals.sent}\nRecibidas: ${profile.totals.received}\nFavorita enviada: ${getFavoriteInteraction(profile.sent)}`
        },
        {
          name: "Interacciones enviadas",
          value: buildStatsLines(profile.sent)
        },
        {
          name: "Interacciones recibidas",
          value: buildStatsLines(profile.received)
        }
      )
      .setFooter({
        text: `Ultima actualizacion: ${new Date(profile.updatedAt).toLocaleString("es-CL")}`
      });

    await interaction.reply({ embeds: [embed] });
  }
};
