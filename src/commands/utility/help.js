const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { BOT_PREFIX, COMMAND_CATEGORIES } = require("../../config/constants");

const CATEGORY_LABELS = Object.freeze({
  [COMMAND_CATEGORIES.ADMIN]: "Admin",
  [COMMAND_CATEGORIES.ECONOMY]: "Economia",
  [COMMAND_CATEGORIES.GAMES]: "Minijuegos",
  [COMMAND_CATEGORIES.INTERACTION]: "Interaccion",
  [COMMAND_CATEGORIES.MODERATION]: "Moderacion",
  [COMMAND_CATEGORIES.UTILITY]: "Utilidad"
});

const CATEGORY_ORDER = [
  COMMAND_CATEGORIES.UTILITY,
  COMMAND_CATEGORIES.INTERACTION,
  COMMAND_CATEGORIES.GAMES,
  COMMAND_CATEGORIES.ECONOMY,
  COMMAND_CATEGORIES.MODERATION,
  COMMAND_CATEGORIES.ADMIN
];

const FIELD_VALUE_LIMIT = 1024;

function getCommandDescription(command) {
  const payload = command.data.toJSON();
  return payload.description || "Sin descripcion.";
}

function splitFieldLines(lines) {
  const chunks = [];
  let currentChunk = "";

  for (const line of lines) {
    const nextChunk = currentChunk ? `${currentChunk}\n${line}` : line;

    if (nextChunk.length > FIELD_VALUE_LIMIT) {
      chunks.push(currentChunk);
      currentChunk = line;
      continue;
    }

    currentChunk = nextChunk;
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
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
      .setDescription(`Prefijo actual: \`${BOT_PREFIX}\`\nEjemplo: \`${BOT_PREFIX}hug @usuario\`\nLos comandos slash siguen disponibles.`);

    for (const category of CATEGORY_ORDER) {
      const commands = groups.get(category);

      if (!commands || !commands.length) {
        continue;
      }

      const lines = commands
        .sort((leftCommand, rightCommand) => leftCommand.data.name.localeCompare(rightCommand.data.name))
        .map((command) => `\`${BOT_PREFIX}${command.data.name}\` - ${getCommandDescription(command)}`);
      const chunks = splitFieldLines(lines);

      chunks.forEach((chunk, index) => {
        embed.addFields({
          name: index === 0
            ? CATEGORY_LABELS[category] || category
            : `${CATEGORY_LABELS[category] || category} (${index + 1})`,
          value: chunk
        });
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
