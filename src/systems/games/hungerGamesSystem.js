const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");
const {
  HUNGER_GAMES_WIN_REWARD,
  addCoins,
  formatCurrency
} = require("../economy/economySystem");
const { recordMissionEvent } = require("../missions/missionSystem");

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 24;
const CUSTOM_ID_CONTINUE = "hungergames:continue";
const CUSTOM_ID_CANCEL = "hungergames:cancel";

let activeGame = null;

const DAY_OPENINGS = [
  "Amanece con poca visibilidad. Los tributos se mueven con cuidado y evitan hacer ruido.",
  "La arena cambia durante la noche. Los caminos seguros de ayer ya no parecen tan confiables.",
  "El cansancio empieza a pesar. Cada decision pequena puede terminar separando a los fuertes de los distraidos.",
  "Los recursos escasean. Nadie quiere gastar energia, pero quedarse quieto tambien es peligroso.",
  "El dia empieza tenso. Los sobrevivientes saben que cada encuentro puede cambiar la partida."
];

const SURVIVAL_EVENTS = [
  "{a} encuentra agua y decide esconder parte para la noche.",
  "{a} revisa un campamento abandonado y rescata suministros utiles.",
  "{a} evita una zona abierta y gana tiempo para recuperarse.",
  "{a} prepara un refugio simple antes de que caiga la tarde.",
  "{a} sigue huellas recientes, pero decide no arriesgarse todavia.",
  "{a} encuentra comida suficiente para resistir un dia mas.",
  "{a} cambia de ruta al notar que alguien ya paso por ahi.",
  "{a} cubre sus rastros y se aleja del centro de la arena."
];

const TENSION_EVENTS = [
  "{a} ve a {b} a lo lejos, pero ninguno quiere iniciar una pelea sin ventaja.",
  "{a} y {b} comparten unos minutos de tregua antes de separarse en silencio.",
  "{a} intenta seguir a {b}, pero pierde el rastro cerca de una zona rocosa.",
  "{a} le roba suministros menores a {b} y desaparece antes de ser descubierto.",
  "{a} y {b} llegan al mismo escondite. La tension sube, pero ambos retroceden.",
  "{a} distrae a {b} con ruido falso y aprovecha para cambiar de posicion.",
  "{a} obliga a {b} a abandonar una ruta segura.",
  "{a} sospecha que {b} le tendio una trampa y decide rodear el area."
];

const ELIMINATION_EVENTS = [
  "{a} intenta recuperar suministros en una zona expuesta. {b} aprovecha la distraccion y lo elimina.",
  "{a} fuerza una pelea sin energia suficiente. {b} resiste mejor y lo deja fuera.",
  "{a} cae en una trampa cerca de un refugio abandonado y no logra escapar.",
  "{a} se separa demasiado del grupo de sobrevivientes y queda atrapado por la arena.",
  "{a} toma una ruta inestable para evitar a {b}, pero el desvio termina costandole la partida.",
  "{a} intenta cruzar una zona peligrosa antes del anochecer y queda eliminado.",
  "{a} pierde sus suministros, se arriesga a recuperarlos y termina fuera del juego.",
  "{a} baja la guardia creyendo que estaba solo. {b} estaba mas cerca de lo que parecia.",
  "{a} entra en un refugio sin revisar la salida. Cuando intenta huir, ya es tarde.",
  "{a} queda agotado despues de una persecucion y no puede seguir compitiendo."
];

const FINAL_EVENTS = [
  "{a} espera a que {b} cometa el primer error y gana el ultimo enfrentamiento.",
  "{a} guarda fuerzas durante el dia y supera a {b} cuando la arena se cierra.",
  "{a} usa mejor los ultimos suministros y deja a {b} sin opciones.",
  "{a} convierte el terreno en ventaja y derrota a {b} en el cierre.",
  "{a} mantiene la calma en el duelo final y elimina a {b}."
];

const DAY_CLOSINGS = [
  "Cae la noche. Los sobrevivientes se esconden y cuentan lo poco que les queda.",
  "La arena queda en silencio por unos minutos. Nadie sabe quien se movera primero manana.",
  "El dia termina con menos nombres en pie y mas miedo entre los que quedan.",
  "Los sobrevivientes descansan poco. La siguiente jornada promete ser mas dura.",
  "La noche obliga a todos a detenerse, pero nadie duerme tranquilo."
];

function sanitizeName(name) {
  return name
    .replace(/<@!?\d+>/g, "")
    .replace(/@/g, "arroba")
    .replace(/[`*_~|>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32);
}

async function getMentionParticipant(interaction, userId) {
  try {
    const member = await interaction.guild.members.fetch(userId);
    return {
      id: userId,
      name: sanitizeName(member.displayName || member.user.username)
    };
  } catch (error) {
    try {
      const user = await interaction.client.users.fetch(userId);
      return {
        id: userId,
        name: sanitizeName(user.globalName || user.username)
      };
    } catch (fetchError) {
      return {
        id: userId,
        name: `Usuario ${userId.slice(-4)}`
      };
    }
  }
}

function splitManualNames(input) {
  const cleanedInput = input.replace(/<@!?\d+>/g, " ");
  const separatorPattern = /[,;\n|]+/;

  if (separatorPattern.test(cleanedInput)) {
    return cleanedInput.split(separatorPattern);
  }

  return cleanedInput.split(/\s+/);
}

async function parseParticipants(input, interaction) {
  const participants = [];
  const usedKeys = new Set();
  const mentionIds = [...input.matchAll(/<@!?(\d+)>/g)].map((match) => match[1]);

  for (const userId of mentionIds) {
    const participant = await getMentionParticipant(interaction, userId);
    const key = `user:${participant.id}`;

    if (!usedKeys.has(key) && participant.name) {
      participants.push(participant);
      usedKeys.add(key);
    }
  }

  for (const rawName of splitManualNames(input)) {
    const name = sanitizeName(rawName);
    const key = `name:${name.toLowerCase()}`;

    if (!name || usedKeys.has(key)) {
      continue;
    }

    participants.push({
      id: null,
      name
    });
    usedKeys.add(key);
  }

  return participants.slice(0, MAX_PLAYERS);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function formatTemplate(template, participants) {
  return template
    .replace("{a}", participants[0]?.name || "Alguien")
    .replace("{b}", participants[1]?.name || "la arena");
}

function formatAliveCount(aliveCount) {
  return aliveCount === 1 ? "Queda 1 sobreviviente." : `Quedan ${aliveCount} sobrevivientes.`;
}

function getAlivePlayers(game) {
  return game.players.filter((player) => player.alive);
}

function getDeadPlayers(game) {
  return game.players.filter((player) => !player.alive);
}

function createControlRow(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(CUSTOM_ID_CONTINUE)
      .setLabel("Continuar")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(CUSTOM_ID_CANCEL)
      .setLabel("Cancelar")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)
  );
}

function createDayEvents(game) {
  const alivePlayers = getAlivePlayers(game);
  const events = [pickRandom(DAY_OPENINGS)];
  const shuffledAlivePlayers = shuffle(alivePlayers);
  const survivalEventCount = Math.min(Math.max(1, Math.floor(alivePlayers.length / 4)), 3);

  for (let index = 0; index < survivalEventCount; index += 1) {
    const firstPlayer = shuffledAlivePlayers[index % shuffledAlivePlayers.length];
    events.push(formatTemplate(pickRandom(SURVIVAL_EVENTS), [firstPlayer]));
  }

  if (alivePlayers.length > 2) {
    const tensionEventCount = Math.min(Math.max(1, Math.floor(alivePlayers.length / 5)), 2);

    for (let index = 0; index < tensionEventCount; index += 1) {
      const firstPlayer = shuffledAlivePlayers[(index + survivalEventCount) % shuffledAlivePlayers.length];
      const secondPlayer = shuffledAlivePlayers[(index + survivalEventCount + 1) % shuffledAlivePlayers.length];
      events.push(formatTemplate(pickRandom(TENSION_EVENTS), [firstPlayer, secondPlayer]));
    }
  }

  const refreshedAlivePlayers = shuffle(getAlivePlayers(game));
  const eliminationCount = Math.max(1, Math.min(Math.ceil(refreshedAlivePlayers.length / 5), refreshedAlivePlayers.length - 1));
  const eliminatedPlayers = refreshedAlivePlayers.slice(0, eliminationCount);

  for (const eliminatedPlayer of eliminatedPlayers) {
    const possibleWitnesses = refreshedAlivePlayers.filter((player) => player.name !== eliminatedPlayer.name);
    const witness = pickRandom(possibleWitnesses) || null;
    const isFinalDuel = getAlivePlayers(game).length === 2;
    const template = isFinalDuel ? pickRandom(FINAL_EVENTS) : pickRandom(ELIMINATION_EVENTS);

    eliminatedPlayer.alive = false;
    eliminatedPlayer.eliminatedDay = game.day;
    events.push(formatTemplate(template, isFinalDuel ? [witness, eliminatedPlayer] : [eliminatedPlayer, witness]));
  }

  events.push(`${pickRandom(DAY_CLOSINGS)} ${formatAliveCount(getAlivePlayers(game).length)}`);

  return events;
}

async function rewardWinner(game, winner) {
  if (!winner.id || game.rewarded) {
    return null;
  }

  const user = {
    id: winner.id,
    username: winner.name,
    globalName: winner.name
  };
  const wallet = await addCoins(user, HUNGER_GAMES_WIN_REWARD);
  game.rewarded = true;

  return `Recompensa para ${winner.name}: ${formatCurrency(HUNGER_GAMES_WIN_REWARD)}. Balance: ${formatCurrency(wallet.balance)}.`;
}

async function buildGameEmbed(game, events, rewardText = null) {
  const alivePlayers = getAlivePlayers(game);
  const deadPlayers = getDeadPlayers(game);
  const embed = new EmbedBuilder()
    .setColor(alivePlayers.length === 1 ? 0xf9c74f : 0xb56576)
    .setTitle(`Hunger Games - Dia ${game.day}`)
    .setDescription(events.map((event) => `- ${event}`).join("\n"))
    .addFields(
      {
        name: "Siguen en pie",
        value: alivePlayers.map((player) => player.name).join(", ") || "Nadie"
      },
      {
        name: "Eliminados",
        value: deadPlayers.map((player) => player.name).join(", ") || "Nadie"
      }
    );

  if (alivePlayers.length === 1) {
    embed.setTitle("Hunger Games - Ganador");
    embed.addFields({
      name: "Victoria",
      value: `${alivePlayers[0].name} gana la partida.`
    });

    if (rewardText) {
      embed.addFields({
        name: "Recompensa",
        value: rewardText
      });
    }
  } else {
    embed.setFooter({
      text: "Solo quien inicio la partida puede continuar o cancelar."
    });
  }

  return embed;
}

async function startGame(interaction, input) {
  if (activeGame) {
    return {
      ok: false,
      reason: "active"
    };
  }

  const participants = await parseParticipants(input, interaction);

  if (participants.length < MIN_PLAYERS) {
    return {
      ok: false,
      reason: "not_enough_players",
      participants
    };
  }

  activeGame = {
    channelId: interaction.channelId,
    guildId: interaction.guildId,
    starterId: interaction.user.id,
    day: 1,
    players: participants.map((participant) => ({
      ...participant,
      alive: true,
      eliminatedDay: null
    })),
    rewarded: false,
    createdAt: Date.now()
  };

  await recordMissionEvent(interaction.user, "hungergames");
  const events = createDayEvents(activeGame);
  const alivePlayers = getAlivePlayers(activeGame);
  const rewardText = alivePlayers.length === 1 ? await rewardWinner(activeGame, alivePlayers[0]) : null;
  const embed = await buildGameEmbed(activeGame, events, rewardText);

  if (alivePlayers.length === 1) {
    activeGame = null;
    return {
      ok: true,
      embed,
      components: []
    };
  }

  return {
    ok: true,
    embed,
    components: [createControlRow()]
  };
}

async function continueGame(interaction) {
  if (!activeGame) {
    await interaction.reply({
      content: "No hay una partida de Hunger Games activa.",
      ephemeral: true
    });
    return;
  }

  if (interaction.user.id !== activeGame.starterId) {
    await interaction.reply({
      content: "Solo quien inicio esta partida puede continuarla o cancelarla.",
      ephemeral: true
    });
    return;
  }

  if (interaction.customId === CUSTOM_ID_CANCEL) {
    activeGame = null;
    await interaction.update({
      content: "La partida de Hunger Games fue cancelada.",
      embeds: [],
      components: []
    });
    return;
  }

  activeGame.day += 1;
  const events = createDayEvents(activeGame);
  const alivePlayers = getAlivePlayers(activeGame);
  const rewardText = alivePlayers.length === 1 ? await rewardWinner(activeGame, alivePlayers[0]) : null;
  const embed = await buildGameEmbed(activeGame, events, rewardText);

  if (alivePlayers.length === 1) {
    activeGame = null;
    await interaction.update({
      embeds: [embed],
      components: []
    });
    return;
  }

  await interaction.update({
    embeds: [embed],
    components: [createControlRow()]
  });
}

function isHungerGamesButton(interaction) {
  return interaction.isButton() && [CUSTOM_ID_CONTINUE, CUSTOM_ID_CANCEL].includes(interaction.customId);
}

module.exports = {
  MAX_PLAYERS,
  MIN_PLAYERS,
  continueGame,
  isHungerGamesButton,
  startGame
};
