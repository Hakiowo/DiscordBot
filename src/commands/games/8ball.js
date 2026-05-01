const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const {
  EIGHT_BALL_REWARD,
  addCoins,
  formatCurrency
} = require("../../systems/economy/economySystem");
const { recordMissionEvent } = require("../../systems/missions/missionSystem");
const { rollRandomEventField } = require("../../systems/randomEvents/randomEventSystem");

const ANSWERS = [
  "La esfera vibra como si hubiera visto el futuro dos veces. Si, pero no lo grites todavia.",
  "El destino acaba de levantar una ceja. Probablemente si.",
  "Las estrellas dicen que si, aunque una de ellas pidio no quedar citada.",
  "Si. La respuesta llego con capa, brillo y exceso de confianza.",
  "Todo apunta a que si, pero deja que el universo finja que fue idea suya.",
  "La probabilidad esta sonriendo raro. Me inclino por un si.",
  "Hay buena energia. Tambien hay caos, pero del util.",
  "Respuesta corta: si. Respuesta dramatica: el cosmos ya empezo los tramites.",
  "No ahora. El futuro puso el cartel de vuelvo en 5 minutos.",
  "La esfera se quedo mirando al vacio. Eso suele ser un no.",
  "No. Y por alguna razon el destino lo dijo con voz de moderador.",
  "Mejor no. Hay demasiadas piezas sueltas en esa linea temporal.",
  "La respuesta es no, pero con aprendizaje desbloqueado.",
  "El universo hizo una pausa incomoda. Yo esperaria.",
  "Ni la esfera quiere firmar esa prediccion. Intentalo despues.",
  "No lo veo claro. Hay niebla, ruido y una sospechosa falta de snacks.",
  "Puede ser. El futuro esta negociando con recursos humanos.",
  "Pregunta de nuevo cuando Mercurio termine de hacer teatro.",
  "La respuesta existe, pero viene en DLC.",
  "El destino tiro una moneda y cayo de canto. Eso es un tal vez elegante.",
  "Hay posibilidades, pero dependen de una decision pequena que aun no tomas.",
  "La esfera dice: hazlo, pero con plan B y agua cerca.",
  "No puedo confirmar ni negar. El universo pidio abogado.",
  "Hoy no hay certeza, solo vibes con presupuesto limitado."
];

function getRandomAnswer() {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}

module.exports = {
  category: COMMAND_CATEGORIES.GAMES,
  data: new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Hazle una pregunta a la bola magica.")
    .addStringOption((option) =>
      option
        .setName("pregunta")
        .setDescription("La pregunta que quieres hacerle al destino.")
        .setRequired(true)
        .setMaxLength(200)
    ),
  async execute(interaction) {
    const question = interaction.options.getString("pregunta");
    const wallet = await addCoins(interaction.user, EIGHT_BALL_REWARD);
    await recordMissionEvent(interaction.user, "8ball");
    const eventField = await rollRandomEventField(interaction.user);

    const embed = new EmbedBuilder()
      .setColor(0x9b5de5)
      .setTitle("Bola magica")
      .addFields(
        {
          name: "Pregunta",
          value: question
        },
        {
          name: "Respuesta",
          value: getRandomAnswer()
        },
        {
          name: "Recompensa",
          value: `Ganaste ${formatCurrency(EIGHT_BALL_REWARD)}. Balance: ${formatCurrency(wallet.balance)}.`
        }
      );

    if (eventField) {
      embed.addFields(eventField);
    }

    await interaction.reply({ embeds: [embed] });
  }
};
