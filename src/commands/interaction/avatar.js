const { SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");

module.exports = {
  category: COMMAND_CATEGORIES.INTERACTION,
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Muestra tu avatar o el de otro usuario.")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Usuario del que deseas ver el avatar.")
        .setRequired(false)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser("usuario") || interaction.user;

    await interaction.reply({
      content: `Avatar de ${user.username}: ${user.displayAvatarURL({ size: 1024 })}`
    });
  }
};
