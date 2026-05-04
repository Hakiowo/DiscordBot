const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { BOT_PREFIX, COMMAND_CATEGORIES } = require("../../config/constants");
const { formatCurrency, getShopItems } = require("../../systems/economy/economySystem");

function buildShopLines() {
  return getShopItems()
    .map((item) => `${BOT_PREFIX}buy objeto:${item.id} - ${item.name} - ${formatCurrency(item.price)}\n${item.description}`)
    .join("\n\n");
}

module.exports = {
  category: COMMAND_CATEGORIES.ECONOMY,
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Muestra la tienda de objetos con Haki Coins."),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xf8961e)
      .setTitle("Tienda Haki")
      .setDescription(buildShopLines());

    await interaction.reply({ embeds: [embed] });
  }
};
