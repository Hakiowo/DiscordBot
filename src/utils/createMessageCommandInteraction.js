const { ApplicationCommandOptionType } = require("discord.js");

function sanitizeReplyPayload(payload) {
  if (typeof payload === "string") {
    return payload;
  }

  const { ephemeral, ...publicPayload } = payload;
  return publicPayload;
}

function resolveUser(message, rawValue) {
  const mentionedUser = message.mentions.users.first();

  if (mentionedUser) {
    return mentionedUser;
  }

  if (!rawValue) {
    return null;
  }

  const userId = rawValue.replace(/[<@!>]/g, "");
  return message.client.users.cache.get(userId) || null;
}

function parseCommandArguments(rawArgs, optionNames) {
  const namedValues = new Map();
  const positionalArgs = [];
  const tokens = rawArgs.split(/\s+/).filter(Boolean);
  let currentName = null;

  for (const token of tokens) {
    const namedMatch = token.match(/^([^:\s]+):(.*)$/);

    if (namedMatch && optionNames.has(namedMatch[1])) {
      currentName = namedMatch[1];
      namedValues.set(currentName, namedMatch[2] ? [namedMatch[2]] : []);
      continue;
    }

    if (currentName) {
      namedValues.get(currentName).push(token);
      continue;
    }

    positionalArgs.push(token);
  }

  for (const [name, valueParts] of namedValues) {
    namedValues.set(name, valueParts.join(" ").trim());
  }

  return { namedValues, positionalArgs };
}

function buildOptionValues(command, message, args, rawArgs) {
  const optionValues = new Map();
  const payload = command.data.toJSON();
  const options = payload.options || [];
  const subcommands = options.filter((option) => option.type === ApplicationCommandOptionType.Subcommand);
  let activeOptions = options;
  let activeRawArgs = rawArgs;

  if (subcommands.length) {
    const requestedSubcommand = args[0];
    const selectedSubcommand = subcommands.find((option) => option.name === requestedSubcommand) || subcommands[0];

    optionValues.set("__subcommand", selectedSubcommand.name);
    activeOptions = selectedSubcommand.options || [];
    activeRawArgs = selectedSubcommand.name === requestedSubcommand
      ? rawArgs.slice(requestedSubcommand.length).trim()
      : rawArgs;
  }

  const optionNames = new Set(activeOptions.map((option) => option.name));
  const { namedValues, positionalArgs } = parseCommandArguments(activeRawArgs, optionNames);
  let index = 0;

  if (subcommands.length && !activeOptions.length) {
    return optionValues;
  }

  for (const option of activeOptions) {
    const hasNamedValue = namedValues.has(option.name);
    const namedValue = namedValues.get(option.name);

    if (option.type === ApplicationCommandOptionType.User) {
      optionValues.set(option.name, resolveUser(message, namedValue || positionalArgs[index]));

      if (!hasNamedValue) {
        index += 1;
      }

      continue;
    }

    if (option.type === ApplicationCommandOptionType.String) {
      const remainingText = positionalArgs.slice(index).join(" ").trim();
      const value = hasNamedValue ? namedValue || null : remainingText || null;

      optionValues.set(option.name, value);
      break;
    }

    if (option.type === ApplicationCommandOptionType.Integer) {
      const value = Number.parseInt(namedValue || positionalArgs[index], 10);
      optionValues.set(option.name, Number.isNaN(value) ? null : value);

      if (!hasNamedValue) {
        index += 1;
      }
    }
  }

  return optionValues;
}

function createMessageCommandInteraction({ message, commandName, command, args, rawArgs }) {
  const optionValues = buildOptionValues(command, message, args, rawArgs);
  let replyMessage = null;

  return {
    client: message.client,
    channel: message.channel,
    channelId: message.channelId,
    commandName,
    guild: message.guild,
    guildId: message.guildId,
    member: message.member,
    user: message.author,
    replied: false,
    deferred: false,
    options: {
      getUser(name) {
        return optionValues.get(name) || null;
      },
      getString(name) {
        return optionValues.get(name) || null;
      },
      getInteger(name) {
        return optionValues.get(name) || null;
      },
      getSubcommand() {
        return optionValues.get("__subcommand") || null;
      }
    },
    async reply(payload) {
      replyMessage = await message.reply(sanitizeReplyPayload(payload));
      this.replied = true;
      return replyMessage;
    },
    async editReply(payload) {
      if (!replyMessage) {
        return this.reply(payload);
      }

      return replyMessage.edit(sanitizeReplyPayload(payload));
    },
    async followUp(payload) {
      return message.channel.send(sanitizeReplyPayload(payload));
    }
  };
}

module.exports = { createMessageCommandInteraction };
