const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const {
  HAKI_PASS_ITEM_ID,
  buyItem,
  formatCurrency,
  getShopItems
} = require("../../systems/economy/economySystem");
const { grantHakiPassRole } = require("../../utils/grantHakiPassRole");

module.exports = {
  category: COMMAND_CATEGORIES.ECONOMY,
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Compra un objeto de la tienda con Haki Coins.")
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
        content: `No tienes suficientes Haki Coins para comprar ${result.item.name}. Necesitas ${formatCurrency(result.item.price)} y tienes ${formatCurrency(result.wallet.balance)}.`,
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

    const roleResult = result.item.id === HAKI_PASS_ITEM_ID ? await grantHakiPassRole(interaction) : null;
    const embed = new EmbedBuilder()
      .setColor(0xf3722c)
      .setTitle("Compra realizada")
      .setDescription(
        `Compraste ${result.item.name} por ${formatCurrency(result.item.price)}.\nBalance actual: ${formatCurrency(result.wallet.balance)}.`
      );

    if (result.item.id === HAKI_PASS_ITEM_ID) {
      embed
        .setColor(0xf9c74f)
        .addFields({
          name: "*** HakiPass desbloqueado ***",
          value: [
            "Felicidades obtuviste el HakiPass.",
            "No hace nada pero ahi tienes.",
            roleResult?.granted
              ? `Rol otorgado: ${roleResult.role}`
              : "No pude otorgar el rol HakiPass. Revisa permisos y jerarquia de roles."
          ].join("\n")
        });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
