const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const {
  formatCurrency,
  getShopItems,
  getWallet
} = require("../../systems/economy/economySystem");

function buildInventoryLine(inventory) {
  const entries = Object.entries(inventory).filter(([, amount]) => amount > 0);
  const itemNames = new Map(getShopItems().map((item) => [item.id, item.name]));

  if (!entries.length) {
    return "Sin objetos comprados.";
  }

  return entries
    .map(([itemId, amount]) => `${itemNames.get(itemId) || itemId}: ${amount}`)
    .join("\n");
}

module.exports = {
  category: COMMAND_CATEGORIES.ECONOMY,
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Consulta tus Haki Coins o las de otro usuario.")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Usuario del que deseas consultar el balance.")
        .setRequired(false)
    ),
  async execute(interaction) {
    const targetUser = interaction.options.getUser("usuario") || interaction.user;
    const wallet = await getWallet(targetUser);

    const embed = new EmbedBuilder()
      .setColor(0xf9c74f)
      .setTitle(`Economia de ${wallet.displayName}`)
      .addFields(
        {
          name: "Balance",
          value: formatCurrency(wallet.balance),
          inline: true
        },
        {
          name: "Ganado",
          value: formatCurrency(wallet.earned),
          inline: true
        },
        {
          name: "Gastado",
          value: formatCurrency(wallet.spent),
          inline: true
        },
        {
          name: "Inventario",
          value: buildInventoryLine(wallet.inventory)
        }
      );

    await interaction.reply({ embeds: [embed] });
  }
};
