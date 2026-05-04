const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { COMMAND_CATEGORIES } = require("../../config/constants");
const {
  SLOTS_PLAY_COST,
  addCoins,
  formatCurrency,
  spendCoins
} = require("../../systems/economy/economySystem");
const { recordMissionEvent } = require("../../systems/missions/missionSystem");
const { rollRandomEventField } = require("../../systems/randomEvents/randomEventSystem");

const SPIN_FRAMES = [
  ["❔", "❔", "❔"],
  ["🍒", "❔", "❔"],
  ["🍋", "🔔", "❔"],
  ["⭐", "🍒", "💎"],
  ["🔔", "7️⃣", "🍋"]
];

const SYMBOLS = [
  { emoji: "🍒", weight: 28, multiplier: 2 },
  { emoji: "🍋", weight: 24, multiplier: 3 },
  { emoji: "🔔", weight: 19, multiplier: 4 },
  { emoji: "⭐", weight: 14, multiplier: 6 },
  { emoji: "💎", weight: 10, multiplier: 9 },
  { emoji: "7️⃣", weight: 5, multiplier: 15 }
];

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatReels(reels) {
  return `╔═══════════╗\n║ ${reels.join(" | ")} ║\n╚═══════════╝`;
}

function rollSymbol() {
  const totalWeight = SYMBOLS.reduce((total, symbol) => total + symbol.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const symbol of SYMBOLS) {
    roll -= symbol.weight;

    if (roll <= 0) {
      return symbol;
    }
  }

  return SYMBOLS[0];
}

function rollResult() {
  return [rollSymbol(), rollSymbol(), rollSymbol()];
}

function getPayout(result) {
  const [first, second, third] = result;

  if (first.emoji === second.emoji && second.emoji === third.emoji) {
    return SLOTS_PLAY_COST * first.multiplier;
  }

  if (first.emoji === second.emoji || first.emoji === third.emoji || second.emoji === third.emoji) {
    return Math.floor(SLOTS_PLAY_COST * 1.5);
  }

  return 0;
}

function getPrizeTier(payout) {
  if (payout >= SLOTS_PLAY_COST * 9) {
    return "jackpot";
  }

  if (payout >= SLOTS_PLAY_COST * 4) {
    return "big";
  }

  if (payout > 0) {
    return "small";
  }

  return "none";
}

function decoratePrizeText({ payout, balance, tier }) {
  if (tier === "jackpot") {
    return [
      "✨💎✨ **JACKPOT** ✨💎✨",
      "🎊🎰🎊 Los carretes explotaron en suerte.",
      `Ganaste ${formatCurrency(payout)}.`,
      `Balance: ${formatCurrency(balance)}.`
    ].join("\n");
  }

  if (tier === "big") {
    return [
      "🌟 **Premio grande** 🌟",
      "🎉 La maquina pago fuerte esta ronda.",
      `Ganaste ${formatCurrency(payout)}.`,
      `Balance: ${formatCurrency(balance)}.`
    ].join("\n");
  }

  return `🎉 Ganaste ${formatCurrency(payout)}. Balance: ${formatCurrency(balance)}.`;
}

function buildEmbed({ title, reels, description, color, eventField }) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(`${formatReels(reels)}\n\n${description}`);

  if (eventField) {
    embed.addFields(eventField);
  }

  return embed;
}

module.exports = {
  category: COMMAND_CATEGORIES.GAMES,
  data: new SlashCommandBuilder()
    .setName("tragaperras")
    .setDescription("Juega una maquina tragaperras usando Haki Coins."),
  async execute(interaction) {
    const payment = await spendCoins(interaction.user, SLOTS_PLAY_COST);

    if (!payment.spent) {
      await interaction.reply({
        content: `Necesitas ${formatCurrency(SLOTS_PLAY_COST)} para jugar. Tu balance actual es ${formatCurrency(payment.wallet.balance)}.`,
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      embeds: [
        buildEmbed({
          title: "🎰 Tragaperras",
          reels: SPIN_FRAMES[0],
          description: `Insertaste ${formatCurrency(SLOTS_PLAY_COST)}. La maquina empieza a girar...`,
          color: 0xf8961e
        })
      ]
    });

    for (const frame of SPIN_FRAMES.slice(1)) {
      await wait(250);
      await interaction.editReply({
        embeds: [
          buildEmbed({
            title: "🎰 Tragaperras",
            reels: frame,
            description: "Los carretes siguen girando...",
            color: 0xf8961e
          })
        ]
      });
    }

    const result = rollResult();
    const payout = getPayout(result);
    let finalWallet = payment.wallet;

    await recordMissionEvent(interaction.user, "slots");

    if (payout > 0) {
      finalWallet = await addCoins(interaction.user, payout);
    }

    const eventField = await rollRandomEventField(interaction.user);
    const prizeTier = getPrizeTier(payout);
    const resultText = payout > 0
      ? `🎉 Ganaste ${formatCurrency(payout)}. Balance: ${formatCurrency(finalWallet.balance)}.`
      : `💨 No hubo premio esta vez. Balance: ${formatCurrency(finalWallet.balance)}.`;
    const decoratedResultText = payout > 0
      ? decoratePrizeText({ payout, balance: finalWallet.balance, tier: prizeTier })
      : resultText;
    const titleByTier = {
      jackpot: "🎰💎 Tragaperras - JACKPOT 💎🎰",
      big: "🎰🌟 Tragaperras - Premio grande 🌟",
      small: "🎰 Tragaperras - Premio",
      none: "🎰 Tragaperras - Sin premio"
    };
    const colorByTier = {
      jackpot: 0xffd166,
      big: 0xf9c74f,
      small: 0x90be6d,
      none: 0x577590
    };

    await wait(300);
    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: titleByTier[prizeTier],
          reels: result.map((symbol) => symbol.emoji),
          description: decoratedResultText,
          color: colorByTier[prizeTier],
          eventField
        })
      ]
    });
  }
};
