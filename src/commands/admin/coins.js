const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const { adjustCoins, formatCurrency } = require("../../systems/economy/economySystem");

function isGuildOwner(interaction) {
  return Boolean(interaction.guild && interaction.guild.ownerId === interaction.user.id);
}

function buildResultEmbed({ action, targetUser, amount, result }) {
  const actionLabel = action === "add" ? "agregadas" : "quitadas";
  const color = action === "add" ? 0x43aa8b : 0xf94144;

  return new EmbedBuilder()
    .setColor(color)
    .setTitle("Monedas ajustadas")
    .setDescription(
      [
        `Usuario: ${targetUser}`,
        `Monedas ${actionLabel}: ${formatCurrency(Math.abs(result.appliedAmount))}`,
        `Balance anterior: ${formatCurrency(result.previousBalance)}`,
        `Balance actual: ${formatCurrency(result.wallet.balance)}`
      ].join("\n")
    );
}

module.exports = {
  category: COMMAND_CATEGORIES.ADMIN,
  data: new SlashCommandBuilder()
    .setName("coins")
    .setDescription("Ajusta Haki Coins de un usuario. Solo owner del servidor.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Otorga Haki Coins a un usuario.")
        .addUserOption((option) =>
          option
            .setName("usuario")
            .setDescription("Usuario que recibira monedas.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("cantidad")
            .setDescription("Cantidad de monedas a otorgar.")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Quita Haki Coins a un usuario.")
        .addUserOption((option) =>
          option
            .setName("usuario")
            .setDescription("Usuario al que se le quitaran monedas.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("cantidad")
            .setDescription("Cantidad de monedas a quitar.")
            .setRequired(true)
            .setMinValue(1)
        )
    ),
  async execute(interaction) {
    if (!isGuildOwner(interaction)) {
      await interaction.reply({
        content: "Solo el owner del servidor puede usar este comando.",
        ephemeral: true
      });
      return;
    }

    const action = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser("usuario");
    const amount = interaction.options.getInteger("cantidad");
    const signedAmount = action === "remove" ? -amount : amount;
    const result = await adjustCoins(targetUser, signedAmount);

    await interaction.reply({
      embeds: [
        buildResultEmbed({
          action,
          targetUser,
          amount,
          result
        })
      ],
      ephemeral: true
    });
  }
};
