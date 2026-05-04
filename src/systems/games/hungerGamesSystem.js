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

const DESCRIPTIVE_DAY_OPENINGS = [
  "Amanece con poca visibilidad. Los tributos avanzan despacio y escuchan cada movimiento.",
  "La arena cambio durante la noche. Los caminos seguros de ayer ya no parecen confiables.",
  "El cansancio empieza a pesar. Una mala decision puede decidir quien sigue en pie.",
  "Los recursos escasean. Nadie quiere gastar energia, pero quedarse quieto tambien es peligroso.",
  "El dia empieza tenso. Cada encuentro puede cambiar la partida."
];

const DESCRIPTIVE_SURVIVAL_EVENTS = [
  "{a} encuentra agua en una grieta y guarda parte para pasar la noche.",
  "{a} revisa un campamento abandonado y rescata vendas, cuerda y algo de comida.",
  "{a} evita una zona abierta al ver reflejos entre los arboles y gana tiempo para recuperarse.",
  "{a} arma un refugio bajo raices antes de que la lluvia deje huellas faciles de seguir.",
  "{a} sigue huellas recientes, pero se retira al notar que terminan en una emboscada.",
  "{a} encuentra comida suficiente para resistir un dia mas y la esconde lejos de su refugio.",
  "{a} cambia de ruta al encontrar ramas cortadas demasiado limpias para ser casualidad.",
  "{a} cubre sus rastros con barro y hojas antes de moverse hacia una zona mas alta.",
  "{a} fabrica una lanza improvisada y la prueba contra un tronco antes de seguir.",
  "{a} apaga un fuego ajeno para confundir a quien estuviera siguiendo el humo."
];

const DESCRIPTIVE_TENSION_EVENTS = [
  "{a} ve a {b} a lo lejos, apunta con cuidado y decide no pelear sin ventaja.",
  "{a} y {b} comparten una tregua corta para cruzar una zona inundada antes de separarse.",
  "{a} intenta seguir a {b}, pero pierde el rastro entre piedras sueltas y marcas falsas.",
  "{a} roba una bolsa pequena de {b} y desaparece antes de que pueda alcanzarlo.",
  "{a} y {b} llegan al mismo escondite. Ambos se amenazan, pero retroceden al oir pasos cerca.",
  "{a} distrae a {b} lanzando piedras hacia otra ruta y aprovecha para cambiar de posicion.",
  "{a} obliga a {b} a abandonar un sendero seguro bloqueando la salida con ramas secas.",
  "{a} sospecha que {b} preparo una trampa y rodea el area durante casi una hora.",
  "{a} persigue a {b} hasta un arroyo, pero pierde la oportunidad cuando el terreno se vuelve resbaloso.",
  "{a} negocia con {b} intercambiar informacion falsa por comida y ambos se van desconfiando."
];

const DESCRIPTIVE_ELIMINATION_EVENTS = [
  "{a} intenta recuperar suministros en una zona expuesta; activa una alarma improvisada y cae antes de escapar.",
  "{a} fuerza una pelea sin energia, falla el primer golpe y queda fuera del juego.",
  "{a} cae en una trampa cerca de un refugio abandonado y no logra soltarse antes de que la arena lo cierre.",
  "{a} se separa demasiado buscando agua y queda atrapado cuando el terreno empieza a hundirse.",
  "{a} toma una ruta inestable por un barranco; el desvio rapido termina costandole la partida.",
  "{a} cruza una zona peligrosa antes del anochecer, pisa una cuerda oculta y queda eliminado.",
  "{a} pierde sus suministros, vuelve por ellos con prisa y entra directo en una zona vigilada.",
  "{a} baja la guardia creyendo que estaba solo y desaparece entre la niebla sin poder pedir ayuda.",
  "{a} entra en un refugio sin revisar la salida. Cuando intenta huir, el paso ya esta bloqueado.",
  "{a} queda agotado despues de una persecucion y no puede defenderse cuando la arena lo alcanza."
];

const DESCRIPTIVE_KILL_EVENTS = [
  "{a} espera a que {b} revise una mochila falsa y lo elimina cuando queda expuesto.",
  "{a} acorrala a {b} contra una zona sin salida y gana el forcejeo con una lanza improvisada.",
  "{a} sigue a {b} durante horas, corta su unica ruta de escape y lo deja fuera del juego.",
  "{a} usa humo para obligar a {b} a moverse y lo elimina al salir de su escondite.",
  "{a} finge retirarse, atrae a {b} hasta una cuerda oculta y aprovecha la caida para eliminarlo.",
  "{a} sorprende a {b} mientras bebe agua y termina el enfrentamiento antes de que pueda reaccionar.",
  "{a} roba el arma de {b} durante un descuido y lo elimina despues de una pelea corta.",
  "{a} empuja a {b} hacia una zona abierta y lo deja sin cobertura cuando la arena se cierra."
];

const DESCRIPTIVE_FINAL_EVENTS = [
  "{a} espera a que {b} cometa el primer error, le corta la retirada y gana el ultimo enfrentamiento.",
  "{a} guarda fuerzas durante el dia y supera a {b} cuando la arena los obliga a chocar.",
  "{a} usa mejor los ultimos suministros, deja a {b} sin agua y lo derrota en el cierre.",
  "{a} convierte el terreno en ventaja, obliga a {b} a subir una pendiente y gana desde arriba.",
  "{a} mantiene la calma en el duelo final, esquiva el ataque de {b} y lo elimina."
];

const DESCRIPTIVE_DAY_CLOSINGS = [
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

function removePlayer(players, playerToRemove) {
  const index = players.findIndex((player) => player === playerToRemove);

  if (index >= 0) {
    players.splice(index, 1);
  }
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
  const events = [pickRandom(DESCRIPTIVE_DAY_OPENINGS)];
  const shuffledAlivePlayers = shuffle(alivePlayers);
  const eliminationCount = Math.max(1, Math.min(Math.ceil(alivePlayers.length / 5), alivePlayers.length - 1));
  const eliminatedPlayers = shuffledAlivePlayers.slice(0, eliminationCount);
  const survivors = shuffledAlivePlayers.slice(eliminationCount);
  const playersWithoutAction = [...survivors];

  if (alivePlayers.length === 2) {
    const eliminatedPlayer = eliminatedPlayers[0];
    const winner = survivors[0];

    eliminatedPlayer.alive = false;
    eliminatedPlayer.eliminatedDay = game.day;
    events.push(formatTemplate(pickRandom(DESCRIPTIVE_FINAL_EVENTS), [winner, eliminatedPlayer]));
    events.push(`${pickRandom(DESCRIPTIVE_DAY_CLOSINGS)} ${formatAliveCount(getAlivePlayers(game).length)}`);

    return events;
  }

  for (const eliminatedPlayer of eliminatedPlayers) {
    const attacker = survivors.length && Math.random() < 0.65 ? pickRandom(survivors) : null;

    eliminatedPlayer.alive = false;
    eliminatedPlayer.eliminatedDay = game.day;

    if (attacker) {
      removePlayer(playersWithoutAction, attacker);
      events.push(formatTemplate(pickRandom(DESCRIPTIVE_KILL_EVENTS), [attacker, eliminatedPlayer]));
      continue;
    }

    events.push(formatTemplate(pickRandom(DESCRIPTIVE_ELIMINATION_EVENTS), [eliminatedPlayer]));
  }

  const pendingPlayers = shuffle(playersWithoutAction);

  while (pendingPlayers.length >= 2) {
    const firstPlayer = pendingPlayers.shift();
    const secondPlayer = pendingPlayers.shift();
    events.push(formatTemplate(pickRandom(DESCRIPTIVE_TENSION_EVENTS), [firstPlayer, secondPlayer]));
  }

  if (pendingPlayers.length) {
    events.push(formatTemplate(pickRandom(DESCRIPTIVE_SURVIVAL_EVENTS), [pendingPlayers.shift()]));
  }

  events.push(`${pickRandom(DESCRIPTIVE_DAY_CLOSINGS)} ${formatAliveCount(getAlivePlayers(game).length)}`);

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
    .setTitle(`🏹 Hunger Games - Dia ${game.day}`)
    .setDescription(events.map((event) => `- ${event}`).join("\n"))
    .addFields(
      {
        name: "🛡️ Siguen en pie",
        value: alivePlayers.map((player) => player.name).join(", ") || "Nadie"
      },
      {
        name: "☠️ Eliminados",
        value: deadPlayers.map((player) => player.name).join(", ") || "Nadie"
      }
    );

  if (alivePlayers.length === 1) {
    embed.setTitle("🏆 Hunger Games - Ganador");
    embed.addFields({
      name: "👑 Victoria",
      value: `${alivePlayers[0].name} gana la partida.`
    });

    if (rewardText) {
      embed.addFields({
        name: "🪙 Recompensa",
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
