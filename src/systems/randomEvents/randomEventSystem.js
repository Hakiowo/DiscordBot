const { addCoins, formatCurrency, getWallet } = require("../economy/economySystem");

const EVENT_CHANCE = 0.18;
const EVENTS = [
  {
    text: "Encontraste una bolsita brillante entre los comandos.",
    amount: 18
  },
  {
    text: "El destino te pago intereses por causar entretenimiento.",
    amount: 24
  },
  {
    text: "Una notificacion misteriosa venia con premio incluido.",
    amount: 12
  },
  {
    text: "La tienda Genial te dio cashback por existir.",
    amount: 15
  },
  {
    text: "El universo intento cobrarte impuestos, pero fallo el formulario.",
    amount: 9
  }
];

function pickRandomEvent() {
  return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}

async function rollRandomEvent(user) {
  if (Math.random() > EVENT_CHANCE) {
    return null;
  }

  const event = pickRandomEvent();
  const wallet = await addCoins(user, event.amount);

  return {
    text: event.text,
    rewardText: `Evento aleatorio: ${event.text} Ganaste ${formatCurrency(event.amount)}. Balance: ${formatCurrency(wallet.balance)}.`
  };
}

async function rollRandomEventField(user) {
  const event = await rollRandomEvent(user);

  if (!event) {
    return null;
  }

  return {
    name: "Evento aleatorio",
    value: event.rewardText.replace("Evento aleatorio: ", "")
  };
}

async function getRandomEventPreview(user) {
  const wallet = await getWallet(user);
  return `Los eventos aleatorios pueden aparecer al usar comandos de actividad. Balance actual: ${formatCurrency(wallet.balance)}.`;
}

module.exports = {
  getRandomEventPreview,
  rollRandomEvent,
  rollRandomEventField
};
