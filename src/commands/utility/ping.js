const { SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");

module.exports = {
  category: COMMAND_CATEGORIES.UTILITY,
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Responde con la latencia actual del bot."),
  async execute(interaction, client) {
    const latency = client.ws.ping;

    await interaction.reply(`Pong. Latencia actual: ${latency}ms`);
  }
};
