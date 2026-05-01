const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");

const CATEGORY_LABELS = Object.freeze({
  [COMMAND_CATEGORIES.ADMIN]: "Admin",
  [COMMAND_CATEGORIES.ECONOMY]: "Economia",
  [COMMAND_CATEGORIES.GAMES]: "Minijuegos",
  [COMMAND_CATEGORIES.INTERACTION]: "Interaccion",
  [COMMAND_CATEGORIES.MODERATION]: "Moderacion",
  [COMMAND_CATEGORIES.UTILITY]: "Utilidad"
});

function getCommandDescription(command) {
  const payload = command.data.toJSON();
  return payload.description || "Sin descripcion.";
}

function buildCommandGroups(commands) {
  const groups = new Map();

  for (const command of commands.values()) {
    const category = command.category || COMMAND_CATEGORIES.UTILITY;

    if (!groups.has(category)) {
      groups.set(category, []);
    }

    groups.get(category).push(command);
  }

  return groups;
}

module.exports = {
  category: COMMAND_CATEGORIES.UTILITY,
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Muestra los comandos disponibles del bot."),
  async execute(interaction, client) {
    const groups = buildCommandGroups(client.commands);
    const embed = new EmbedBuilder()
      .setColor(0x577590)
      .setTitle("Comandos disponibles")
      .setDescription("Estos son los comandos que puedo ejecutar ahora mismo.");

    for (const [category, commands] of groups.entries()) {
      const lines = commands
        .sort((leftCommand, rightCommand) => leftCommand.data.name.localeCompare(rightCommand.data.name))
        .map((command) => `/${command.data.name} - ${getCommandDescription(command)}`)
        .join("\n");

      embed.addFields({
        name: CATEGORY_LABELS[category] || category,
        value: lines
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
