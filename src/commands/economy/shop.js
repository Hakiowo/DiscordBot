const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const { formatCurrency, getShopItems } = require("../../systems/economy/economySystem");

function buildShopLines() {
  return getShopItems()
    .map((item) => `/buy objeto:${item.id} - ${item.name} - ${formatCurrency(item.price)}\n${item.description}`)
    .join("\n\n");
}

module.exports = {
  category: COMMAND_CATEGORIES.ECONOMY,
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Muestra la tienda de objetos con Genial Coins."),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xf8961e)
      .setTitle("Tienda Genial")
      .setDescription(buildShopLines());

    await interaction.reply({ embeds: [embed] });
  }
};
