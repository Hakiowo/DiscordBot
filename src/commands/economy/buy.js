const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const {
  buyItem,
  formatCurrency,
  getShopItems
} = require("../../systems/economy/economySystem");

module.exports = {
  category: COMMAND_CATEGORIES.ECONOMY,
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Compra un objeto de la tienda con Genial Coins.")
    .addStringOption((option) => {
      const itemOption = option
        .setName("objeto")
        .setDescription("Objeto que quieres comprar.")
        .setRequired(true);

      for (const item of getShopItems()) {
        itemOption.addChoices({ name: item.name, value: item.id });
      }

      return itemOption;
    }),
  async execute(interaction) {
    const itemId = interaction.options.getString("objeto");
    const result = await buyItem(interaction.user, itemId);

    if (!result.bought && result.reason === "insufficient_funds") {
      await interaction.reply({
        content: `No tienes suficientes Genial Coins para comprar ${result.item.name}. Necesitas ${formatCurrency(result.item.price)} y tienes ${formatCurrency(result.wallet.balance)}.`,
        ephemeral: true
      });
      return;
    }

    if (!result.bought) {
      await interaction.reply({
        content: "Ese objeto no existe en la tienda.",
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xf3722c)
      .setTitle("Compra realizada")
      .setDescription(
        `Compraste ${result.item.name} por ${formatCurrency(result.item.price)}.\nBalance actual: ${formatCurrency(result.wallet.balance)}.`
      );

    await interaction.reply({ embeds: [embed] });
  }
};
